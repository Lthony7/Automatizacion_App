import { CostEngine, createInMemoryCostStore } from '../src/cost-management';
import {
  CostGuard,
  createInMemoryLimitStore,
  createInMemoryVideoUsageStore,
  createInMemoryAuditLog,
  createInMemoryAdminNotifier,
} from '../src/cost-guard';

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean) {
  if (condition) { passed++; console.log(`  OK ${name}`); }
  else { failed++; console.log(`  FAIL ${name}`); }
}
function close(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.0001;
}

(async () => {
console.log('=== FASE 14 Cost Management ===\n');

const day = new Date(2026, 2, 10, 12, 0); // Mar 10 2026
const earlierInMonth = new Date(2026, 2, 3, 9, 0);
const prevMonth = new Date(2026, 1, 20, 15, 0);

// --- Engine: registration + calculations ---------------------------------
{
  const store = createInMemoryCostStore();
  const engine = new CostEngine(store);
  await engine.recordCosts([
    { tenantId: 't1', projectId: 'p1', contentId: 'v1', category: 'ai', provider: 'gemini', amountUsd: 0.4, recordedAt: earlierInMonth },
    { tenantId: 't1', projectId: 'p1', contentId: 'v1', category: 'tts', provider: 'elevenlabs', amountUsd: 0.2, recordedAt: earlierInMonth },
    { tenantId: 't1', projectId: 'p1', contentId: 'v1', category: 'rendering', provider: 'ffmpeg', amountUsd: 0.1, recordedAt: earlierInMonth },
    { tenantId: 't1', projectId: 'p1', contentId: 'v2', category: 'ai', provider: 'groq', amountUsd: 0.5, recordedAt: day },
    { tenantId: 't1', projectId: 'p1', contentId: 'v2', category: 'storage', provider: 's3', amountUsd: 0.05, recordedAt: day },
    // overhead without contentId
    { tenantId: 't1', projectId: 'p1', category: 'api_calls', provider: 'youtube-api', amountUsd: 1.0, recordedAt: day },
    // other tenant / other month
    { tenantId: 't2', projectId: 'q1', contentId: 'z1', category: 'ai', provider: 'gemini', amountUsd: 9.0, recordedAt: day },
    { tenantId: 't1', contentId: 'v9', category: 'ai', provider: 'gemini', amountUsd: 50.0, recordedAt: prevMonth },
  ]);

  const dCost = await engine.dailyCost('t1', day);
  assert('daily_cost = 1.55 (solo t1/hoy, incluye overhead)', close(dCost, 1.55));
  const mCost = await engine.monthlyCost('t1', day);
  assert('monthly_cost = 2.25 (marzo t1)', close(mCost, 2.25));

  const perVideo = await engine.costPerVideo('t1', { from: new Date(2026, 2, 1), to: new Date(2026, 3, 1) });
  // attributed march: v1=0.7, v2=0.55 => 1.25/2 = 0.625 ; overhead excluded
  assert('cost_per_video = 0.625 (overhead excluido)', close(perVideo, 0.625));

  const bd = await engine.breakdown('t1');
  const ai = bd.byCategory.find((c) => c.key === 'ai');
  assert('breakdown por categoría: ai primero', bd.byCategory[0].key === 'ai' && close(bd.grandTotalUsd, 52.25));
  assert('pct de ai correcta', ai !== undefined && Math.abs(ai.pct - (50.9 / 52.25) * 100) < 0.01);
  assert('breakdown por proyecto incluye p1', bd.byProject.some((p) => p.key === 'p1'));
  assert('breakdown por proveedor incluye youtube-api', bd.byProvider.some((p) => p.key === 'youtube-api'));
}

// --- Guard: daily_video_limit = 5 (canStartVideo auto-registers starts) ---
{
  const costs = new CostEngine(createInMemoryCostStore());
  const audit = createInMemoryAuditLog();
  const notifier = createInMemoryAdminNotifier();
  const guard = new CostGuard({
    costs,
    limits: createInMemoryLimitStore([
      { id: 'L1', tenantId: 't1', scope: 'tenant', kind: 'daily_video_limit', value: 5, active: true },
    ]),
    videos: createInMemoryVideoUsageStore(),
    audit,
    notifier,
  });

  for (let i = 1; i <= 5; i++) {
    const check = await guard.canStartVideo('t1', { now: day, contentId: `v${i}` });
    if (!check.allowed) { assert(`video #${i} permitido`, false); break; }
    assert(`video #${i} permitido`, true);
  }

  const sixth = await guard.canStartVideo('t1', { now: day, contentId: 'v6' });
  assert('video #6 BLOQUEADO (límite diario alcanzado)', !sixth.allowed);
  assert('reasons mencionan daily_video_limit', sixth.reasons.some((r) => r.includes('daily_video_limit')));
  assert('audit event creado al bloquear', (await audit.list('t1')).some((e) => e.type === 'cost_limit_reached' && e.severity === 'critical'));
  assert('admin notificado al bloquear', notifier.sent().length >= 1);
}

// stop + audit + notify + monthly budget (configurable) end-to-end
{
  const costs = new CostEngine(createInMemoryCostStore());
  const audit = createInMemoryAuditLog();
  const notifier = createInMemoryAdminNotifier();
  const guard = new CostGuard({
    costs,
    limits: createInMemoryLimitStore([
      { id: 'L-daily', tenantId: 'acme', scope: 'tenant', kind: 'daily_video_limit', value: 5, active: true },
      { id: 'L-budget', tenantId: 'acme', scope: 'tenant', kind: 'monthly_budget_usd', value: 10, active: true },
    ]),
    videos: createInMemoryVideoUsageStore(),
    audit,
    notifier,
  });

  // canStartVideo auto-registers; 5 allowed, 6th blocked by daily limit
  for (let i = 1; i <= 5; i++) {
    await guard.canStartVideo('acme', { now: day, projectId: 'p1', contentId: `v${i}` });
  }
  let check = await guard.canStartVideo('acme', { now: day, projectId: 'p1' });
  assert('bloqueado por video limit', !check.allowed);
  assert('audit event creado', (await audit.list('acme')).some((e) => e.type === 'cost_limit_reached'));
  assert('admin notificado (video limit)', notifier.sent().length >= 1);

  // next day videos OK again, but month budget breached by big spend
  const nextDay = new Date(2026, 2, 11, 8, 0);
  await costs.recordCost({ tenantId: 'acme', contentId: 'big', category: 'rendering', provider: 'ffmpeg', amountUsd: 99, recordedAt: nextDay });
  check = await guard.canStartVideo('acme', { now: nextDay, projectId: 'p1' });
  assert('monthly_budget configurable bloquea al alcanzarlo', !check.allowed);
  assert('reasons incluyen monthly_budget_usd', check.reasons.some((r) => r.includes('monthly_budget_usd')));
  assert('audit para budget mensual', (await audit.list('acme')).filter((e) => e.metadata && (e.metadata as Record<string, unknown>).kind === 'monthly_budget_usd').length >= 1);

  // different tenant, higher configurable budget -> NOT blocked by same pattern
  const guard2 = new CostGuard({
    costs,
    limits: createInMemoryLimitStore([
      { id: 'L-b2', tenantId: 'bigco', scope: 'tenant', kind: 'monthly_budget_usd', value: 1000, active: true },
    ]),
    videos: createInMemoryVideoUsageStore(),
    audit: createInMemoryAuditLog(),
    notifier: createInMemoryAdminNotifier(),
  });
  const bigco = await guard2.canStartVideo('bigco', { now: nextDay });
  assert('presupuesto configurable por tenant (bigco=1000 permite)', bigco.allowed);
}

// --- Project/provider scoping --------------------------------------------
{
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

  const blockedProject = await guard.canStartVideo('tp', { projectId: 'pA', provider: 'gemini', now: day });
  assert('límite de proyecto pA bloquea', !blockedProject.allowed);

  const otherProjectOk = await guard.canStartVideo('tp', { projectId: 'pB', provider: 'openai', now: day });
  assert('otro proyecto NO afectado por límite de pA', otherProjectOk.allowed);

  const geminiBlocked = await guard.canStartVideo('tp', { projectId: 'pB', provider: 'gemini', now: day });
  assert('proveedor gemini bloqueado (limit 0)', !geminiBlocked.allowed);

  const pAOpenai = await guard.canStartVideo('tp', { projectId: 'pA', provider: 'openai', now: day });
  // provider is fine but project pA budget is breached regardless of provider
  assert('pA bloquea también con proveedor permitido', !pAOpenai.allowed);
}

// --- status() percentages --------------------------------------------------
{
  const costs = new CostEngine(createInMemoryCostStore());
  await costs.recordCost({ tenantId: 'st', category: 'storage', amountUsd: 2.5, recordedAt: new Date(2026, 2, 10, 11, 0) });
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
  assert('status pctUsed = 25%', st.length === 1 && Math.abs(st[0].pctUsed - 25) < 0.01 && !st[0].breached);

  const none = await guard.canStartVideo('st', { now: day });
  assert('bajo el límite: permitido y sin notificaciones', none.allowed && none.evaluations[0] !== undefined);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
})();
