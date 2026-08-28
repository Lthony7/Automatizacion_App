import { AnalyticsEngine, createInMemoryAnalyticsStore } from '../src/analytics-engine';
import { ContentIntelligence } from '../src/content-intelligence';
import type { AnalyzedContent } from '../src/analytics-engine';

/**
 * FASE 13: the SAME generic engine + intelligence serve every vertical.
 * There is NO BibleAnalyticsService and NO AutomotiveAnalyticsService:
 * verticals differ only by the generic metadata they provide.
 */

function christianDataset(): AnalyzedContent[] {
  const mk = (id: string, contentType: string, platform: string): AnalyzedContent => ({
    id,
    tenantId: 'tenant-christian',
    metadata: {
      vertical: 'christian',
      contentType,
      hook: 'question',
      template: 'verse-overlay',
      durationSeconds: 45,
      publishedAt: new Date(2026, 0, 10, 21, 30),
      platform,
    },
  });
  return [
    // night prayers outperform
    mk('c1', 'oraciones_nocturnas', 'youtube'),
    mk('c2', 'oraciones_nocturnas', 'instagram'),
    mk('c3', 'oraciones_nocturnas', 'facebook'),
    mk('c4', 'versiculos', 'youtube'),
    mk('c5', 'versiculos', 'instagram'),
    mk('c6', 'versiculos', 'facebook'),
  ];
}

function automotiveDataset(): AnalyzedContent[] {
  const mk = (id: string, contentType: string, duration: number): AnalyzedContent => ({
    id,
    tenantId: 'tenant-automotive',
    metadata: {
      vertical: 'automotive',
      contentType,
      hook: 'problem-solution',
      template: 'split-screen',
      durationSeconds: duration,
      publishedHour: 13,
      platform: 'youtube',
    },
  });
  return [
    // diagnosis videos retain better
    mk('a1', 'diagnostico', 40),
    mk('a2', 'diagnostico', 55),
    mk('a3', 'diagnostico', 35),
    mk('a4', 'mantenimiento', 40),
    mk('a5', 'mantenimiento', 55),
    mk('a6', 'mantenimiento', 35),
  ];
}

describe('FASE 13 Analytics Engine + Content Intelligence', () => {
  describe('generic aggregation', () => {
    const store = createInMemoryAnalyticsStore();
    const engine = new AnalyticsEngine(store);

    beforeAll(async () => {
      await engine.registerContents(christianDataset());
      await engine.recordMetrics([
        { contentId: 'c1', tenantId: 'tenant-christian', metric: 'views', value: 10000 },
        { contentId: 'c2', tenantId: 'tenant-christian', metric: 'views', value: 9000 },
        { contentId: 'c3', tenantId: 'tenant-christian', metric: 'views', value: 8000 },
        { contentId: 'c4', tenantId: 'tenant-christian', metric: 'views', value: 3000 },
        { contentId: 'c5', tenantId: 'tenant-christian', metric: 'views', value: 2500 },
        { contentId: 'c6', tenantId: 'tenant-christian', metric: 'views', value: 2000 },
        { contentId: 'c1', tenantId: 'tenant-christian', metric: 'retention_rate', value: 70 },
        { contentId: 'c2', tenantId: 'tenant-christian', metric: 'retention_rate', value: 68 },
        { contentId: 'c3', tenantId: 'tenant-christian', metric: 'retention_rate', value: 66 },
      ]);
    });

    test('groups metrics by generic dimension without domain knowledge', async () => {
      const report = await engine.reportFor('tenant-christian', 'content_type');
      expect(report.dimension).toBe('content_type');
      expect(report.segments.map((s) => s.segment).sort()).toEqual(['oraciones_nocturnas', 'versiculos']);
      const prayers = report.segments.find((s) => s.segment === 'oraciones_nocturnas')!;
      expect(prayers.contentCount).toBe(3);
      expect(prayers.averages.views).toBeCloseTo(9000);
    });

    test('latest snapshot wins per metric', async () => {
      await engine.recordMetric({ contentId: 'c1', tenantId: 'tenant-christian', metric: 'views', value: 11000 });
      const report = await engine.reportFor('tenant-christian', 'content_type');
      const prayers = report.segments.find((s) => s.segment === 'oraciones_nocturnas')!;
      expect(prayers.averages.views).toBeCloseTo((11000 + 9000 + 8000) / 3);
    });

    test('contents missing dimension metadata are excluded', async () => {
      const empty = new AnalyticsEngine(createInMemoryAnalyticsStore());
      const report = await empty.reportFor('tenant-x', 'platform');
      expect(report.analyzedContents).toBe(0);
      expect(report.segments).toHaveLength(0);
    });
  });

  describe('Content Intelligence generates recommendations generically', () => {
    test('Christian dataset -> night prayers recommendation (views)', async () => {
      const engine = new AnalyticsEngine(createInMemoryAnalyticsStore());
      await engine.registerContents(christianDataset());
      await engine.recordMetrics([
        { contentId: 'c1', tenantId: 'tenant-christian', metric: 'views', value: 10000 },
        { contentId: 'c2', tenantId: 'tenant-christian', metric: 'views', value: 9000 },
        { contentId: 'c3', tenantId: 'tenant-christian', metric: 'views', value: 8000 },
        { contentId: 'c4', tenantId: 'tenant-christian', metric: 'views', value: 3000 },
        { contentId: 'c5', tenantId: 'tenant-christian', metric: 'views', value: 2500 },
        { contentId: 'c6', tenantId: 'tenant-christian', metric: 'views', value: 2000 },
      ]);

      const intel = new ContentIntelligence(engine);
      const recs = await intel.recommend('tenant-christian');

      expect(recs.length).toBeGreaterThan(0);
      const top = recs[0];
      expect(top.segment).toBe('oraciones_nocturnas');
      expect(top.metric).toBe('views');
      expect(top.message.toLowerCase()).toContain('oraciones nocturnas');
      expect(top.message).toContain('mejor rendimiento');
    });

    test('Automotive dataset -> diagnosis retention recommendation', async () => {
      const engine = new AnalyticsEngine(createInMemoryAnalyticsStore());
      await engine.registerContents(automotiveDataset());
      await engine.recordMetrics([
        { contentId: 'a1', tenantId: 'tenant-automotive', metric: 'retention_rate', value: 75 },
        { contentId: 'a2', tenantId: 'tenant-automotive', metric: 'retention_rate', value: 72 },
        { contentId: 'a3', tenantId: 'tenant-automotive', metric: 'retention_rate', value: 74 },
        { contentId: 'a4', tenantId: 'tenant-automotive', metric: 'retention_rate', value: 45 },
        { contentId: 'a5', tenantId: 'tenant-automotive', metric: 'retention_rate', value: 43 },
        { contentId: 'a6', tenantId: 'tenant-automotive', metric: 'retention_rate', value: 44 },
      ]);

      const intel = new ContentIntelligence(engine);
      const recs = await intel.recommend('tenant-automotive', {
        dimensions: ['content_type'],
        metrics: ['retention_rate'],
      });

      expect(recs.length).toBeGreaterThan(0);
      const top = recs[0];
      expect(top.segment).toBe('diagnostico');
      expect(top.metric).toBe('retention_rate');
      expect(top.message).toContain('diagnostico');
      expect(top.message).toContain('mayor retención');
    });

    test('SAME engine class serves both verticals (no per-vertical services)', async () => {
      const engine = new AnalyticsEngine(createInMemoryAnalyticsStore()); // one instance handles both tenants
      await engine.registerContents([...christianDataset(), ...automotiveDataset()]);

      const cViews = [10000, 9500, 9000, 3000, 2500, 2000];
      for (let i = 0; i < 6; i++) {
        await engine.recordMetric({ contentId: `c${i + 1}`, tenantId: 'tenant-christian', metric: 'views', value: cViews[i] });
        await engine.recordMetric({
          contentId: `a${i + 1}`,
          tenantId: 'tenant-automotive',
          metric: 'retention_rate',
          value: i < 3 ? 75 - i : 44 + i,
        });
      }

      const intel = new ContentIntelligence(engine); // same intelligence instance

      const christianRecs = await intel.recommend('tenant-christian');
      const automotiveRecs = await intel.recommend('tenant-automotive', { metrics: ['retention_rate'] });

      expect(christianRecs.some((r) => r.segment.includes('nocturnas'))).toBe(true);
      expect(automotiveRecs.some((r) => r.segment === 'diagnostico')).toBe(true);
    });

    test('minSampleSize filters noisy small segments', async () => {
      const engine = new AnalyticsEngine(createInMemoryAnalyticsStore());
      await engine.registerContents([
        { id: 'r1', tenantId: 't', metadata: { contentType: 'rare_type' } },
        { id: 'r2', tenantId: 't', metadata: { contentType: 'rare_type' } },
        { id: 'b1', tenantId: 't', metadata: { contentType: 'base_type' } },
        { id: 'b2', tenantId: 't', metadata: { contentType: 'base_type' } },
        { id: 'b3', tenantId: 't', metadata: { contentType: 'base_type' } },
        { id: 'w1', tenantId: 't', metadata: { contentType: 'winner_type' } },
        { id: 'w2', tenantId: 't', metadata: { contentType: 'winner_type' } },
        { id: 'w3', tenantId: 't', metadata: { contentType: 'winner_type' } },
      ]);
      const views: Array<[string, number]> = [
        ['r1', 999999], ['r2', 999999],
        ['b1', 5000], ['b2', 5000], ['b3', 5000],
        ['w1', 8000], ['w2', 8200], ['w3', 7800],
      ];
      for (const [id, value] of views) {
        await engine.recordMetric({ contentId: id, tenantId: 't', metric: 'views', value });
      }

      const intel = new ContentIntelligence(engine);
      const recs = await intel.recommend('t', {
        dimensions: ['content_type'],
        metrics: ['views'],
        minSampleSize: 3,
      });

      // rare_type (2 samples) is excluded; winner_type beats base_type baseline
      expect(recs).toHaveLength(1);
      expect(recs[0].segment).toBe('winner_type');
    });

    test('segments below lift threshold produce no recommendation', async () => {
      const engine = new AnalyticsEngine(createInMemoryAnalyticsStore());
      await engine.registerContents([
        { id: 'y1', tenantId: 't2', metadata: { platform: 'yt' } },
        { id: 'y2', tenantId: 't2', metadata: { platform: 'yt' } },
        { id: 'y3', tenantId: 't2', metadata: { platform: 'yt' } },
        { id: 'y4', tenantId: 't2', metadata: { platform: 'ig' } },
        { id: 'y5', tenantId: 't2', metadata: { platform: 'ig' } },
        { id: 'y6', tenantId: 't2', metadata: { platform: 'ig' } },
      ]);
      await engine.recordMetric({ contentId: 'y1', tenantId: 't2', metric: 'views', value: 1010 });
      await engine.recordMetric({ contentId: 'y2', tenantId: 't2', metric: 'views', value: 1000 });
      await engine.recordMetric({ contentId: 'y3', tenantId: 't2', metric: 'views', value: 990 });
      await engine.recordMetric({ contentId: 'y4', tenantId: 't2', metric: 'views', value: 1000 });
      await engine.recordMetric({ contentId: 'y5', tenantId: 't2', metric: 'views', value: 1000 });
      await engine.recordMetric({ contentId: 'y6', tenantId: 't2', metric: 'views', value: 1000 });

      const intel = new ContentIntelligence(engine);
      const recs = await intel.recommend('t2', {
        dimensions: ['platform'],
        metrics: ['views'],
        minLiftPct: 10,
      });

      expect(recs).toHaveLength(0);
    });
  });
});
