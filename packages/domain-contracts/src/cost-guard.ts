/**
 * FASE 14: Cost limits and enforcement.
 *
 * When a limit is reached:
 *  1) automatic generation stops (canStartVideo returns allowed=false —
 *     the scheduler/workflow must consult this gate before enqueuing jobs),
 *  2) an audit event is created,
 *  3) the administrator is notified.
 */
import { CostEngine } from './cost-management';
import type { CostCategory } from './cost-management';

export type LimitScope = 'tenant' | 'project' | 'provider';
export type LimitKind = 'daily_video_limit' | 'monthly_budget_usd' | 'daily_budget_usd';

/** Example from spec: daily_video_limit = 5; monthly_budget is configurable. */
export interface CostLimit {
  id: string;
  tenantId: string;
  scope: LimitScope;
  /** projectId when scope='project'; provider name when scope='provider'. */
  refId?: string;
  kind: LimitKind;
  value: number;
  active: boolean;
}

export interface LimitStore {
  list(tenantId: string): Promise<CostLimit[]>;
  save(limit: CostLimit): Promise<void>;
}

export function createInMemoryLimitStore(seed: CostLimit[] = []): LimitStore {
  const byId = new Map<string, CostLimit>();
  for (const l of seed) byId.set(l.id, { ...l });
  return {
    async list(tenantId) {
      return Array.from(byId.values()).filter((l) => l.tenantId === tenantId);
    },
    async save(limit) {
      byId.set(limit.id, { ...limit });
    },
  };
}

// --- Video usage tracking (for daily_video_limit) -----------------------

export interface VideoUsageStore {
  registerStart(tenantId: string, projectId: string | undefined, contentId: string, at: Date): Promise<void>;
  countSince(tenantId: string, opts: { projectId?: string; from: Date; to?: Date }): Promise<number>;
}

export function createInMemoryVideoUsageStore(): VideoUsageStore {
  const starts: Array<{ tenantId: string; projectId?: string; at: Date }> = [];
  return {
    async registerStart(tenantId, projectId, _contentId, at) {
      starts.push({ tenantId, projectId, at: new Date(at) });
    },
    async countSince(tenantId, opts) {
      return starts.filter((s) => {
        if (s.tenantId !== tenantId) return false;
        if (opts.projectId && s.projectId !== opts.projectId) return false;
        if (s.at < opts.from) return false;
        if (opts.to && s.at >= opts.to) return false;
        return true;
      }).length;
    },
  };
}

// --- Audit log + admin notifications -------------------------------------

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  tenantId: string;
  type: string;
  severity: AuditSeverity;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLog {
  append(event: Omit<AuditEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): Promise<AuditEvent>;
  list(tenantId: string): Promise<AuditEvent[]>;
}

export function createInMemoryAuditLog(): AuditLog {
  const events: AuditEvent[] = [];
  let seq = 0;
  return {
    async append(event) {
      const full: AuditEvent = {
        ...event,
        id: event.id ?? `audit-${++seq}`,
        createdAt: event.createdAt ?? new Date(),
      };
      events.push(full);
      return full;
    },
    async list(tenantId) {
      return events.filter((e) => e.tenantId === tenantId);
    },
  };
}

export interface AdminNotification {
  tenantId: string;
  title: string;
  body: string;
  severity: AuditSeverity;
  relatedAuditEventIds: string[];
  createdAt: Date;
}

export interface AdminNotifier {
  notify(notification: AdminNotification): Promise<void>;
  sent(): AdminNotification[];
}

export function createInMemoryAdminNotifier(): AdminNotifier {
  const outbox: AdminNotification[] = [];
  return {
    async notify(n) {
      outbox.push({ ...n });
    },
    sent() {
      return [...outbox];
    },
  };
}

// --- Evaluation + Guard ---------------------------------------------------

export interface LimitEvaluation {
  limitId: string;
  scope: LimitScope;
  refId?: string;
  kind: LimitKind;
  value: number;
  usage: number;
  pctUsed: number;
  breached: boolean;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export interface GuardCheckOptions {
  now?: Date;
  projectId?: string;
  provider?: string;
  /** Attributed video id; required so allowed starts are auto-counted against daily_video_limit. */
  contentId?: string;
}

export class CostGuard {
  constructor(
    private readonly deps: {
      costs: CostEngine;
      limits: LimitStore;
      videos: VideoUsageStore;
      audit: AuditLog;
      notifier: AdminNotifier;
    },
  ) {}

  /** Non-mutating status of every active limit for dashboards. */
  async status(tenantId: string, options: GuardCheckOptions = {}): Promise<LimitEvaluation[]> {
    const now = options.now ?? new Date();
    const limits = (await this.deps.limits.list(tenantId)).filter((l) => l.active);

    const dayFrom = startOfDay(now);
    const monthFrom = startOfDay(now);
    monthFrom.setDate(1);
    // inclusive "now" boundary: stores use half-open ranges [from, to)
    const toNow = new Date(now.getTime() + 1);

    const evaluations: LimitEvaluation[] = [];
    for (const limit of limits) {
      if (!this.appliesTo(limit, options)) continue;

      let usage = 0;
      if (limit.kind === 'daily_video_limit') {
        // tenant/provider scope counts ALL projects; project scope only its own
        usage = await this.deps.videos.countSince(tenantId, {
          projectId: limit.scope === 'project' ? limit.refId : undefined,
          from: dayFrom,
          to: toNow,
        });
      } else if (limit.kind === 'monthly_budget_usd') {
        usage = await this.spendForScope(tenantId, limit, monthFrom, toNow);
      } else {
        usage = await this.spendForScope(tenantId, limit, dayFrom, toNow);
      }

      evaluations.push({
        limitId: limit.id,
        scope: limit.scope,
        refId: limit.refId,
        kind: limit.kind,
        value: limit.value,
        usage,
        pctUsed: limit.value > 0 ? (usage / limit.value) * 100 : 0,
        breached: usage >= limit.value,
      });
    }
    return evaluations;
  }

  /**
   * Gate consulted before starting automatic generation.
   * When allowed, the start is auto-registered so daily_video_limit stays accurate.
   * On any breach: creates audit events + notifies the administrator,
   * then blocks with reasons.
   */
  async canStartVideo(
    tenantId: string,
    options: GuardCheckOptions = {},
  ): Promise<{ allowed: boolean; reasons: string[]; evaluations: LimitEvaluation[] }> {
    const now = options.now ?? new Date();
    const evaluations = await this.status(tenantId, { ...options, now });
    const breached = evaluations.filter((e) => e.breached);
    if (breached.length > 0) {
      const auditIds: string[] = [];
      for (const b of breached) {
        const event = await this.deps.audit.append({
          tenantId,
          type: 'cost_limit_reached',
          severity: 'critical',
          message: `Límite "${b.kind}" (${b.scope}${b.refId ? `:${b.refId}` : ''}) alcanzado: ${round(b.usage)}/${b.value}. Generación automática detenida.`,
          metadata: {
            limitId: b.limitId,
            kind: b.kind,
            scope: b.scope,
            refId: b.refId,
            usage: round(b.usage),
            value: b.value,
          },
          createdAt: now,
        });
        auditIds.push(event.id);
      }

      await this.deps.notifier.notify({
        tenantId,
        title: 'Generación automática pausada',
        body: `${breached.length} límite(s) de costo alcanzado(s): ${breached.map((b) => b.kind).join(', ')}.`,
        severity: 'critical',
        relatedAuditEventIds: auditIds,
        createdAt: now,
      });

      return {
        allowed: false,
        reasons: breached.map(
          (b) => `${b.kind} (${b.scope}${b.refId ? `:${b.refId}` : ''}): ${round(b.usage)}/${b.value}`,
        ),
        evaluations,
      };
    }

    await this.deps.videos.registerStart(
      tenantId,
      options.projectId,
      options.contentId ?? `auto-${now.getTime()}`,
      now,
    );
    return { allowed: true, reasons: [], evaluations };
  }

  private appliesTo(limit: CostLimit, options: GuardCheckOptions): boolean {
    if (limit.scope === 'project') return Boolean(options.projectId && limit.refId === options.projectId);
    if (limit.scope === 'provider') return Boolean(options.provider && limit.refId === options.provider);
    return true; // tenant-wide
  }

  private async spendForScope(tenantId: string, limit: CostLimit, from: Date, to: Date): Promise<number> {
    const extra: { projectId?: string; provider?: string; category?: CostCategory } = {};
    if (limit.scope === 'project') extra.projectId = limit.refId;
    if (limit.scope === 'provider') extra.provider = limit.refId;
    return this.deps.costs.spendBetween(tenantId, from, to, extra);
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
