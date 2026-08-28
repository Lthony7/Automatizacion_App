/**
 * FASE 14: Cost Management.
 *
 * Registers spend per category (AI, TTS, storage, rendering, API calls)
 * and computes cost_per_video / daily_cost / monthly_cost.
 * Generic: no vertical-specific logic; scope is tenant/project/provider.
 */

export type CostCategory = 'ai' | 'tts' | 'storage' | 'rendering' | 'api_calls';

export const ALL_COST_CATEGORIES: readonly CostCategory[] = [
  'ai',
  'tts',
  'storage',
  'rendering',
  'api_calls',
] as const;

export interface CostRecord {
  tenantId: string;
  projectId?: string;
  /** Attributed video/content. Records WITHOUT contentId are overhead (not counted in cost_per_video). */
  contentId?: string;
  category: CostCategory;
  provider?: string;
  amountUsd: number;
  units?: number;
  recordedAt: Date;
}

export interface CostRecordFilter {
  from?: Date;
  to?: Date;
  projectId?: string;
  provider?: string;
  category?: CostCategory;
}

export interface CostStore {
  append(record: CostRecord): Promise<void>;
  list(tenantId: string, filter?: CostRecordFilter): Promise<CostRecord[]>;
}

export function createInMemoryCostStore(): CostStore {
  const records: CostRecord[] = [];
  return {
    async append(record) {
      records.push({ ...record, recordedAt: new Date(record.recordedAt) });
    },
    async list(tenantId, filter) {
      return records.filter((r) => {
        if (r.tenantId !== tenantId) return false;
        if (!filter) return true;
        if (filter.from && r.recordedAt < filter.from) return false;
        if (filter.to && r.recordedAt >= filter.to) return false;
        if (filter.projectId && r.projectId !== filter.projectId) return false;
        if (filter.provider && r.provider !== filter.provider) return false;
        if (filter.category && r.category !== filter.category) return false;
        return true;
      });
    },
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function sum(records: CostRecord[]): number {
  return records.reduce((acc, r) => acc + r.amountUsd, 0);
}

export interface CategoryBreakdownEntry {
  key: string;
  totalUsd: number;
  pct: number;
}

export interface CostBreakdown {
  grandTotalUsd: number;
  byCategory: CategoryBreakdownEntry[];
  byProject: CategoryBreakdownEntry[];
  byProvider: CategoryBreakdownEntry[];
}

export class CostEngine {
  constructor(private readonly store: CostStore) {}

  async recordCost(record: Omit<CostRecord, 'recordedAt'> & { recordedAt?: Date }): Promise<void> {
    await this.store.append({ ...record, recordedAt: record.recordedAt ?? new Date() });
  }

  async recordCosts(
    records: Array<Omit<CostRecord, 'recordedAt'> & { recordedAt?: Date }>,
  ): Promise<void> {
    for (const r of records) await this.recordCost(r);
  }

  /** Average spend attributed to videos (records with contentId). */
  async costPerVideo(tenantId: string, filter?: CostRecordFilter): Promise<number> {
    const records = await this.store.list(tenantId, filter);
    const attributed = records.filter((r) => Boolean(r.contentId));
    const contents = new Set(attributed.map((r) => r.contentId));
    if (contents.size === 0) return 0;
    return sum(attributed) / contents.size;
  }

  async dailyCost(tenantId: string, day: Date, extra?: Omit<CostRecordFilter, 'from' | 'to'>): Promise<number> {
    const from = startOfDay(day);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return sum(await this.store.list(tenantId, { ...extra, from, to }));
  }

  async monthlyCost(tenantId: string, dayWithinMonth: Date, extra?: Omit<CostRecordFilter, 'from' | 'to'>): Promise<number> {
    const from = startOfMonth(dayWithinMonth);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);
    return sum(await this.store.list(tenantId, { ...extra, from, to }));
  }

  /** Spend accumulated between two instants (used by budget limits). */
  async spendBetween(tenantId: string, from: Date, to: Date, extra?: Omit<CostRecordFilter, 'from' | 'to'>): Promise<number> {
    return sum(await this.store.list(tenantId, { ...extra, from, to }));
  }

  async breakdown(tenantId: string, filter?: CostRecordFilter): Promise<CostBreakdown> {
    const records = await this.store.list(tenantId, filter);
    const grandTotalUsd = sum(records);

    const build = (keyOf: (r: CostRecord) => string): CategoryBreakdownEntry[] => {
      const map = new Map<string, number>();
      for (const r of records) {
        const k = keyOf(r);
        map.set(k, (map.get(k) ?? 0) + r.amountUsd);
      }
      return Array.from(map.entries())
        .map(([key, totalUsd]) => ({
          key,
          totalUsd,
          pct: grandTotalUsd > 0 ? (totalUsd / grandTotalUsd) * 100 : 0,
        }))
        .sort((a, b) => b.totalUsd - a.totalUsd);
    };

    return {
      grandTotalUsd,
      byCategory: build((r) => r.category),
      byProject: build((r) => r.projectId ?? '(sin proyecto)'),
      byProvider: build((r) => r.provider ?? '(sin proveedor)'),
    };
  }
}
