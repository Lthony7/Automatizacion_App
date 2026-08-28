import { AnalyticsEngine, createInMemoryAnalyticsStore } from '../src/analytics-engine';
import { ContentIntelligence } from '../src/content-intelligence';
import type { AnalyzedContent } from '../src/analytics-engine';

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean) {
  if (condition) { passed++; console.log(`  OK ${name}`); }
  else { failed++; console.log(`  FAIL ${name}`); }
}

(async () => {
console.log('=== FASE 13 Analytics Engine + Content Intelligence ===\n');

const christianContents: AnalyzedContent[] = ['c1','c2','c3','c4','c5','c6'].map((id, i) => ({
  id,
  tenantId: 'tenant-christian',
  metadata: {
    vertical: 'christian',
    contentType: i < 3 ? 'oraciones_nocturnas' : 'versiculos',
    hook: 'question',
    template: 'verse-overlay',
    durationSeconds: 45,
    publishedAt: new Date(2026, 0, 10, 21, 30),
    platform: i % 3 === 0 ? 'youtube' : i % 3 === 1 ? 'instagram' : 'facebook',
  },
}));

const automotiveContents: AnalyzedContent[] = ['a1','a2','a3','a4','a5','a6'].map((id, i) => ({
  id,
  tenantId: 'tenant-automotive',
  metadata: {
    vertical: 'automotive',
    contentType: i < 3 ? 'diagnostico' : 'mantenimiento',
    hook: 'problem-solution',
    template: 'split-screen',
    durationSeconds: [40, 55, 35, 40, 55, 35][i],
    publishedHour: 13,
    platform: 'youtube',
  },
}));

// Test 1: Christian -> night prayers best performance (views)
{
  const engine = new AnalyticsEngine(createInMemoryAnalyticsStore());
  await engine.registerContents(christianContents);
  const views = [10000, 9000, 8000, 3000, 2500, 2000];
  for (let i = 0; i < 6; i++) {
    await engine.recordMetric({ contentId: `c${i + 1}`, tenantId: 'tenant-christian', metric: 'views', value: views[i] });
  }
  const recs = await new ContentIntelligence(engine).recommend('tenant-christian');
  const top = recs[0];
  assert('Christian: top rec = oraciones_nocturnas', top?.segment === 'oraciones_nocturnas');
  assert('Christian: metric = views', top?.metric === 'views');
  assert('Christian message contains "oraciones nocturnas"', top?.message.toLowerCase().includes('oraciones nocturnas') ?? false);
  assert('Christian message contains "mejor rendimiento"', top?.message.includes('mejor rendimiento') ?? false);
  console.log(`     msg: "${top?.message}"\n`);
}

// Test 2: Automotive -> diagnosis better retention
{
  const engine = new AnalyticsEngine(createInMemoryAnalyticsStore());
  await engine.registerContents(automotiveContents);
  const retention = [75, 72, 74, 45, 43, 44];
  for (let i = 0; i < 6; i++) {
    await engine.recordMetric({ contentId: `a${i + 1}`, tenantId: 'tenant-automotive', metric: 'retention_rate', value: retention[i] });
  }
  const recs = await new ContentIntelligence(engine).recommend('tenant-automotive', {
    dimensions: ['content_type'],
    metrics: ['retention_rate'],
  });
  const top = recs[0];
  assert('Automotive: top rec = diagnostico', top?.segment === 'diagnostico');
  assert('Automotive: metric = retention_rate', top?.metric === 'retention_rate');
  assert('Automotive message contains "mayor retención"', top?.message.includes('mayor retención') ?? false);
  console.log(`     msg: "${top?.message}"\n`);
}

// Test 3: SAME generic engine class serves both verticals
{
  const store = createInMemoryAnalyticsStore();
  const engine = new AnalyticsEngine(store);
  await engine.registerContents([...christianContents, ...automotiveContents]);
  const cViews = [10000, 9500, 9000, 3000, 2500, 2000];
  for (let i = 0; i < 6; i++) {
    await engine.recordMetric({ contentId: `c${i + 1}`, tenantId: 'tenant-christian', metric: 'views', value: cViews[i] });
    await engine.recordMetric({ contentId: `a${i + 1}`, tenantId: 'tenant-automotive', metric: 'retention_rate', value: i < 3 ? 75 - i : 44 + i });
  }
  const intel = new ContentIntelligence(engine);
  const cRecs = await intel.recommend('tenant-christian');
  const aRecs = await intel.recommend('tenant-automotive', { metrics: ['retention_rate'] });
  assert('Genericity: same engine class, both verticals', cRecs.some((r) => r.segment.includes('nocturnas')) && aRecs.some((r) => r.segment === 'diagnostico'));
}

// Test 4: aggregation groups by dimension correctly
{
  const store = createInMemoryAnalyticsStore();
  const engine = new AnalyticsEngine(store);
  await engine.registerContents(christianContents);
  await engine.recordMetric({ contentId: 'c1', tenantId: 'tenant-christian', metric: 'views', value: 9000 });
  await engine.recordMetric({ contentId: 'c2', tenantId: 'tenant-christian', metric: 'views', value: 9000 });
  await engine.recordMetric({ contentId: 'c3', tenantId: 'tenant-christian', metric: 'views', value: 9000 });
  await engine.recordMetric({ contentId: 'c4', tenantId: 'tenant-christian', metric: 'views', value: 3000 });
  await engine.recordMetric({ contentId: 'c5', tenantId: 'tenant-christian', metric: 'views', value: 3000 });
  await engine.recordMetric({ contentId: 'c6', tenantId: 'tenant-christian', metric: 'views', value: 3000 });
  const report = await engine.reportFor('tenant-christian', 'content_type');
  const prayers = report.segments.find((s) => s.segment === 'oraciones_nocturnas');
  assert('Aggregation: prayers avg views = 9000', prayers?.averages.views === 9000);
  assert('Aggregation: global avg = 6000', report.globalAverages.views === 6000);
}

// Test 5: latest snapshot wins
{
  const store = createInMemoryAnalyticsStore();
  const engine = new AnalyticsEngine(store);
  await engine.registerContents(['s1', 's2', 's3'].map((id) => ({
    id,
    tenantId: 't',
    metadata: { vertical: 'any' },
  })));
  const base = new Date('2026-01-01T00:00:00Z').getTime();
  const snapshots: Array<[string, number, number]> = [
    ['s1', 100, 500],
    ['s2', 100, 100],
    ['s3', 100, 100],
  ];
  for (const [id, first, latest] of snapshots) {
    await engine.recordMetric({ contentId: id, tenantId: 't', metric: 'views', value: first, recordedAt: new Date(base) });
    await engine.recordMetric({ contentId: id, tenantId: 't', metric: 'views', value: latest, recordedAt: new Date(base + 1000) });
  }
  const report = await engine.reportFor('t', 'vertical');
  const seg = report.segments[0];
  assert('Latest snapshot wins per metric', seg?.totals.views === 700);
}

// Test 6: contents without dimension metadata are excluded
{
  const store = createInMemoryAnalyticsStore();
  const engine = new AnalyticsEngine(store);
  await engine.registerContents([
    { id: 'z1', tenantId: 'tz', metadata: { platform: 'youtube' } },
    { id: 'z2', tenantId: 'tz', metadata: {} },
  ]);
  const report = await engine.reportFor('tz', 'platform');
  assert('Missing metadata excluded', report.analyzedContents === 1 && report.segments.length === 1);
}

// Test 7: duration + publication_time buckets
{
  const store = createInMemoryAnalyticsStore();
  const engine = new AnalyticsEngine(store);
  await engine.registerContents(christianContents);
  const dReport = await engine.reportFor('tenant-christian', 'duration');
  const pReport = await engine.reportFor('tenant-christian', 'publication_time');
  assert('Duration bucket works', dReport.segments.length === 1 && dReport.segments[0].segment === '30-60s');
  assert('Publication time bucket works', pReport.segments.length === 1 && pReport.segments[0].segment === 'evening(18-23)');
}

// Test 8: minSampleSize + lift threshold guards
{
  const store = createInMemoryAnalyticsStore();
  const engine = new AnalyticsEngine(store);
  await engine.registerContents([
    { id: 'r1', tenantId: 'tg', metadata: { contentType: 'rare_type' } },
    { id: 'r2', tenantId: 'tg', metadata: { contentType: 'rare_type' } },
    { id: 'b1', tenantId: 'tg', metadata: { contentType: 'base_type' } },
    { id: 'b2', tenantId: 'tg', metadata: { contentType: 'base_type' } },
    { id: 'b3', tenantId: 'tg', metadata: { contentType: 'base_type' } },
    { id: 'w1', tenantId: 'tg', metadata: { contentType: 'winner_type' } },
    { id: 'w2', tenantId: 'tg', metadata: { contentType: 'winner_type' } },
    { id: 'w3', tenantId: 'tg', metadata: { contentType: 'winner_type' } },
  ]);
  const views: Array<[string, number]> = [
    ['r1', 999999], ['r2', 999999],
    ['b1', 5000], ['b2', 5000], ['b3', 5000],
    ['w1', 8000], ['w2', 8200], ['w3', 7800],
  ];
  for (const [id, v] of views) {
    await engine.recordMetric({ contentId: id, tenantId: 'tg', metric: 'views', value: v });
  }
  const recs = await new ContentIntelligence(engine).recommend('tg', {
    dimensions: ['content_type'],
    metrics: ['views'],
    minSampleSize: 3,
  });
  assert('minSampleSize filters small segments', recs.length === 1 && recs[0].segment === 'winner_type');
  console.log(`     msg: "${recs[0]?.message}"\n`);

  // flat data below lift threshold -> no recommendations
  const store2 = createInMemoryAnalyticsStore();
  const engine2 = new AnalyticsEngine(store2);
  await engine2.registerContents([
    { id: 'f1', tenantId: 'tf', metadata: { platform: 'yt' } },
    { id: 'f2', tenantId: 'tf', metadata: { platform: 'yt' } },
    { id: 'f3', tenantId: 'tf', metadata: { platform: 'yt' } },
    { id: 'f4', tenantId: 'tf', metadata: { platform: 'ig' } },
    { id: 'f5', tenantId: 'tf', metadata: { platform: 'ig' } },
    { id: 'f6', tenantId: 'tf', metadata: { platform: 'ig' } },
  ]);
  for (let i = 1; i <= 6; i++) {
    await engine2.recordMetric({ contentId: `f${i}`, tenantId: 'tf', metric: 'views', value: 1000 });
  }
  const flatRecs = await new ContentIntelligence(engine2).recommend('tf', {
    dimensions: ['platform'],
    metrics: ['views'],
    minLiftPct: 10,
  });
  assert('Below lift threshold -> no recommendations', flatRecs.length === 0);
}

// Test 9: NO vertical-specific services exist (structural check)
{
  assert('No BibleAnalyticsService / AutomotiveAnalyticsService in codebase',
    !require('fs').readdirSync('src').some((f: string) => /bible-analytics|automotive-analytics/i.test(f)));
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
})();
