import { CostEngine, createInMemoryCostStore } from '../src/cost-management';
import {
  CostGuard,
  createInMemoryLimitStore,
  createInMemoryVideoUsageStore,
  createInMemoryAuditLog,
  createInMemoryAdminNotifier,
} from '../src/cost-guard';

const day = new Date(2026, 2, 10, 12, 0);

describe('FASE 14 Cost Management', () => {
  describe('CostEngine calculations', () => {
    const engine = new CostEngine(createInMemoryCostStore());

    beforeAll(async () => {
      await engine.recordCosts([
        { tenantId: 't1', projectId: 'p1', contentId: 'v1', category: 'ai', provider: 'gemini', amountUsd: 0.4, recordedAt: new Date(2026, 2, 3, 9) },
        { tenantId: 't1', projectId: 'p1', contentId: 'v1', category: 'tts', provider: 'elevenlabs', amountUsd: 0.2, recordedAt: new Date(2026, 2, 3, 9) },
        { tenantId: 't1', projectId: 'p1', contentId: 'v1', category: 'rendering', provider: 'ffmpeg', amountUsd: 0.1, recordedAt: new Date(2026, 2, 3, 9) },
        { tenantId: 't1', projectId: 'p1', contentId: 'v2', category: 'ai', provider: 'groq', amountUsd: 0.5, recordedAt: day },
        { tenantId: 't1', projectId: 'p1', contentId: 'v2', category: 'storage', provider: 's3', amountUsd: 0.05, recordedAt: day },
        { tenantId: 't1', projectId: 'p1', category: 'api_calls', provider: 'youtube-api', amountUsd: 1.0, recordedAt: day },
        { tenantId: 't2', projectId: 'q1', contentId: 'z1', category: 'ai', provider: 'gemini', amountUsd: 9.0, recordedAt: day },
      ]);
    });

    test('daily_cost sums only same-tenant same-day records', async () => {
      expect(await engine.dailyCost('t1', day)).toBeCloseTo(1.55);
      expect(await engine.dailyCost('t2', day)).toBeCloseTo(9.0);
    });

    test('monthly_cost sums the month', async () => {
      expect(await engine.monthlyCost('t1', day)).toBeCloseTo(2.25);
    });

    test('cost_per_video excludes overhead (no contentId)', async () => {
      const v = await engine.costPerVideo('t1', { from: new Date(2026, 2, 1), to: new Date(2026, 3, 1) });
      expect(v).toBeCloseTo(0.625);
    });

    test('breakdown by category/project/provider', async () => {
      const bd = await engine.breakdown('t1');
      expect(bd.grandTotalUsd).toBeCloseTo(2.25);
      expect(bd.byCategory[0].key).toBe('ai');
      expect(bd.byProject.some((p) => p.key === 'p1')).toBe(true);
      expect(bd.byProvider.some((p) => p.key === 'youtube-api')).toBe(true);
    });
  });

  describe('CostGuard: daily_video_limit = 5', () => {
    async function setup() {
      const audit = createInMemoryAuditLog();
      const notifier = createInMemoryAdminNotifier();
      const guard = new CostGuard({
        costs: new CostEngine(createInMemoryCostStore()),
        limits: createInMemoryLimitStore([
          { id: 'L1', tenantId: 'acme', scope: 'tenant', kind: 'daily_video_limit', value: 5, active: true },
        ]),
        videos: createInMemoryVideoUsageStore(),
        audit,
        notifier,
      });
      return { guard, audit, notifier };
    }

    test('allows first five starts, blocks the sixth with audit + admin notification', async () => {
      const { guard, audit, notifier } = await setup();
      for (let i = 1; i <= 5; i++) {
        const r = await guard.canStartVideo('acme', { now: day, contentId: `v${i}` });
        expect(r.allowed).toBe(true);
      }
      const blocked = await guard.canStartVideo('acme', { now: day, contentId: 'v6' });
      expect(blocked.allowed).toBe(false);
      expect(blocked.reasons.some((r) => r.includes('daily_video_limit'))).toBe(true);
      expect((await audit.list('acme')).some((e) => e.type === 'cost_limit_reached' && e.severity === 'critical')).toBe(true);
      expect(notifier.sent().length).toBeGreaterThanOrEqual(1);
    });

    test('next day the daily counter resets', async () => {
      const { guard } = await setup();
      for (let i = 1; i <= 5; i++) {
        await guard.canStartVideo('acme', { now: day, contentId: `v${i}` });
      }
      const nextDay = new Date(2026, 2, 11, 8);
      const r = await guard.canStartVideo('acme', { now: nextDay, contentId: 'w1' });
      expect(r.allowed).toBe(true);
    });
  });

  describe('CostGuard: configurable monthly budget per tenant', () => {
    function makeGuard(tenantId: string, budget: number, costs: CostEngine) {
      return new CostGuard({
        costs,
        limits: createInMemoryLimitStore([
          { id: `${tenantId}-budget`, tenantId, scope: 'tenant', kind: 'monthly_budget_usd', value: budget, active: true },
        ]),
        videos: createInMemoryVideoUsageStore(),
        audit: createInMemoryAuditLog(),
        notifier: createInMemoryAdminNotifier(),
      });
    }

    test('same spend blocks tenant with budget=10 and allows tenant with budget=1000', async () => {
      const shared = createInMemoryCostStore();
      const engine = new CostEngine(shared);
      await engine.recordCost({ tenantId: 'acme', contentId: 'big', category: 'rendering', provider: 'ffmpeg', amountUsd: 99, recordedAt: new Date(2026, 2, 11, 8) });
      await engine.recordCost({ tenantId: 'bigco', contentId: 'big', category: 'rendering', provider: 'ffmpeg', amountUsd: 99, recordedAt: new Date(2026, 2, 11, 8) });

      const nextDay = new Date(2026, 2, 11, 8);
      const gSmall = makeGuard('acme', 10, new CostEngine(shared));
      const rSmall = await gSmall.canStartVideo('acme', { now: nextDay });
      expect(rSmall.allowed).toBe(false);

      const gBig = makeGuard('bigco', 1000, new CostEngine(shared));
      const rBig = await gBig.canStartVideo('bigco', { now: nextDay });
      expect(rBig.allowed).toBe(true);
    });

    test('budget breach reports monthly_budget_usd with audit event', async () => {
      const engine = new CostEngine(createInMemoryCostStore());
      const audit = createInMemoryAuditLog();
      const notifier = createInMemoryAdminNotifier();
      const guard = new CostGuard({
        costs: engine,
        limits: createInMemoryLimitStore([
          { id: 'b1', tenantId: 'acme', scope: 'tenant', kind: 'monthly_budget_usd', value: 10, active: true },
        ]),
        videos: createInMemoryVideoUsageStore(),
        audit,
        notifier,
      });

      const nextDay = new Date(2026, 2, 11, 8);
      await engine.recordCost({ tenantId: 'acme', contentId: 'big', category: 'rendering', provider: 'ffmpeg', amountUsd: 99, recordedAt: nextDay });
      const r = await guard.canStartVideo('acme', { now: nextDay });
      expect(r.allowed).toBe(false);
      expect(r.reasons.some((x) => x.includes('monthly_budget_usd'))).toBe(true);
      expect((await audit.list('acme')).some((e) => (e.metadata as Record<string, unknown>).kind === 'monthly_budget_usd')).toBe(true);
      expect(notifier.sent().length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Scoping: project and provider limits are isolated', () => {
    async function makeGuard() {
      const costs = new CostEngine(createInMemoryCostStore());
      await costs.recordCost({ tenantId: 'tp', projectId: 'pA', category: 'api_calls', provider: 'openai', amountUsd: 100, recordedAt: new Date(2026, 2, 10, 8) });
      const guard = new CostGuard({
        costs,
        limits: createInMemoryLimitStore([
          { id: 'LP', tenantId: 'tp', scope: 'project', refId: 'pA', kind: 'daily_budget_usd', value: 50, active: true },
          { id: 'LV', tenantId: 'tp', scope: 'provider', refId: 'gemini', kind: 'daily_video_limit', value: 0, active: true },
        ]),
        videos: createInMemoryVideoUsageStore(),
        audit: createInMemoryAuditLog(),
        notifier: createInMemoryAdminNotifier(),
      });
      return guard;
    }

    test('project pA blocked, pB unaffected by pA limit', async () => {
      const guard = await makeGuard();
      expect((await guard.canStartVideo('tp', { projectId: 'pA', provider: 'openai', now: day })).allowed).toBe(false);
      expect((await guard.canStartVideo('tp', { projectId: 'pB', provider: 'openai', now: day })).allowed).toBe(true);
    });

    test('provider-scoped limit blocks only that provider', async () => {
      const guard = await makeGuard();
      expect((await guard.canStartVideo('tp', { projectId: 'pB', provider: 'gemini', now: day })).allowed).toBe(false);
      expect((await guard.canStartVideo('tp', { projectId: 'pB', provider: 'openai', now: day })).allowed).toBe(true);
    });
  });

  describe('status() exposes usage percentages for dashboards', () => {
    test('pctUsed reflects current spend vs limit', async () => {
      const costs = new CostEngine(createInMemoryCostStore());
      await costs.recordCost({ tenantId: 'st', category: 'storage', amountUsd: 2.5, recordedAt: new Date(2026, 2, 10, 11) });
      const guard = new CostGuard({
        costs,
        limits: createInMemoryLimitStore([
          { id: 'S1', tenantId: 'st', scope: 'tenant', kind: 'daily_budget_usd', value: 10, active: true },
        ]),
        videos: createInMemoryVideoUsageStore(),
        audit: createInMemoryAuditLog(),
        notifier: createInMemoryAdminNotifier(),
      });
      const st = await guard.status('st', { now: day });
      expect(st).toHaveLength(1);
      expect(st[0].pctUsed).toBeCloseTo(25);
      expect(st[0].breached).toBe(false);
    });
  });
});
