/**
 * FASE 13: Analytics Engine + Content Intelligence.
 *
 * GENERIC by design: no vertical-specific analytics services exist.
 * Verticals only supply generic metadata keys on content records
 * (e.g. vertical, contentType, template, hook, durationSeconds,
 * publishedAt, platform). The aggregation and recommendation
 * algorithms are dimension-agnostic and data-driven.
 */

export type MetricType =
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'followers'
  | 'watch_time_seconds'
  | 'retention_rate';

export const ALL_METRICS: readonly MetricType[] = [
  'views',
  'likes',
  'comments',
  'shares',
  'followers',
  'watch_time_seconds',
  'retention_rate',
] as const;

export type AnalyticsDimension =
  | 'vertical'
  | 'content_type'
  | 'template'
  | 'hook'
  | 'duration'
  | 'publication_time'
  | 'platform';

export const ALL_DIMENSIONS: readonly AnalyticsDimension[] = [
  'vertical',
  'content_type',
  'template',
  'hook',
  'duration',
  'publication_time',
  'platform',
] as const;

/** retention_rate is expressed as percentage 0–100. */
export interface AnalyzedContent {
  id: string;
  tenantId: string;
  /** Generic metadata. Dimension extractors read from these keys:
   * vertical, contentType, template, hook, durationSeconds, publishedAt|publishedHour, platform */
  metadata: Record<string, unknown>;
}

export interface MetricRecord {
  contentId: string;
  tenantId: string;
  metric: MetricType;
  value: number;
  recordedAt: Date;
}

/** Latest record per (content, metric) wins (snapshot semantics). */
export interface AnalyticsStore {
  saveContent(content: AnalyzedContent): Promise<void>;
  getContent(tenantId: string, contentId: string): Promise<AnalyzedContent | undefined>;
  listContents(tenantId: string): Promise<AnalyzedContent[]>;
  appendMetric(record: MetricRecord): Promise<void>;
  getMetrics(tenantId: string): Promise<MetricRecord[]>;
}

export function createInMemoryAnalyticsStore(): AnalyticsStore {
  const contents = new Map<string, AnalyzedContent>(); // key: `${tenantId}:${contentId}`
  const metrics = new Map<string, MetricRecord>(); // key: `${tenantId}:${contentId}:${metric}`

  return {
    async saveContent(content) {
      contents.set(`${content.tenantId}:${content.id}`, { ...content, metadata: { ...content.metadata } });
    },
    async getContent(tenantId, contentId) {
      return contents.get(`${tenantId}:${contentId}`);
    },
    async listContents(tenantId) {
      return Array.from(contents.values()).filter((c) => c.tenantId === tenantId);
    },
    async appendMetric(record) {
      metrics.set(`${record.tenantId}:${record.contentId}:${record.metric}`, { ...record });
    },
    async getMetrics(tenantId) {
      return Array.from(metrics.values()).filter((m) => m.tenantId === tenantId);
    },
  };
}

// ---------------------------------------------------------------------------
// Generic dimension extraction
// ---------------------------------------------------------------------------

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function durationBucket(seconds: number): string {
  if (seconds < 15) return '<15s';
  if (seconds < 30) return '15-30s';
  if (seconds < 60) return '30-60s';
  if (seconds < 90) return '60-90s';
  return '>90s';
}

function publicationBucket(metadata: Record<string, unknown>): string | undefined {
  const at = metadata['publishedAt'];
  let hour: number | undefined;
  if (at instanceof Date && !Number.isNaN(at.getTime())) hour = at.getHours();
  else if (at instanceof Object && typeof (at as { toDate?: unknown }).toDate === 'function') {
    const d = (at as { toDate: () => Date }).toDate();
    hour = d.getHours();
  } else hour = asNumber(metadata['publishedHour']);
  if (hour === undefined || hour < 0 || hour > 23) return undefined;
  if (hour < 6) return 'night(00-05)';
  if (hour < 12) return 'morning(06-11)';
  if (hour < 18) return 'midday(12-17)';
  return 'evening(18-23)';
}

export const DIMENSION_EXTRACTORS: Record<AnalyticsDimension, (metadata: Record<string, unknown>) => string | undefined> = {
  vertical: (m) => asString(m['vertical']),
  content_type: (m) => asString(m['contentType']),
  template: (m) => asString(m['template']),
  hook: (m) => asString(m['hook']),
  duration: (m) => {
    const s = asNumber(m['durationSeconds']);
    return s === undefined ? undefined : durationBucket(s);
  },
  publication_time: publicationBucket,
  platform: (m) => asString(m['platform']),
};

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export type MetricAverages = Partial<Record<MetricType, number>>;

export interface SegmentAggregate {
  dimension: AnalyticsDimension;
  segment: string;
  contentCount: number;
  totals: MetricAverages;
  averages: MetricAverages;
}

export interface DimensionReport {
  dimension: AnalyticsDimension;
  analyzedContents: number;
  globalTotals: MetricAverages;
  globalAverages: MetricAverages;
  segments: SegmentAggregate[];
}

interface PerContentMetrics {
  totals: Map<MetricType, number>;
  latestAt: Map<MetricType, Date>;
}

function aggregate(records: MetricRecord[], contentIds: Set<string>): {
  perContent: Map<string, PerContentMetrics>;
} {
  const perContent = new Map<string, PerContentMetrics>();
  for (const r of records) {
    if (!contentIds.has(r.contentId)) continue;
    let entry = perContent.get(r.contentId);
    if (!entry) {
      entry = { totals: new Map(), latestAt: new Map() };
      perContent.set(r.contentId, entry);
    }
    const prev = entry.latestAt.get(r.metric);
    if (!prev || prev.getTime() <= r.recordedAt.getTime()) {
      entry.totals.set(r.metric, r.value);
      entry.latestAt.set(r.metric, r.recordedAt);
    }
  }
  return { perContent };
}

function sumAndAverage(perContent: Map<string, PerContentMetrics>): { totals: MetricAverages; averages: MetricAverages; count: number } {
  const sums = new Map<MetricType, number>();
  for (const entry of perContent.values()) {
    for (const [metric, value] of entry.totals) {
      sums.set(metric, (sums.get(metric) ?? 0) + value);
    }
  }
  const count = perContent.size;
  const totals: MetricAverages = {};
  const averages: MetricAverages = {};
  for (const [metric, total] of sums) {
    totals[metric] = total;
    averages[metric] = count > 0 ? total / count : 0;
  }
  return { totals, averages, count };
}

export class AnalyticsEngine {
  constructor(private readonly store: AnalyticsStore) {}

  async registerContent(content: AnalyzedContent): Promise<void> {
    await this.store.saveContent(content);
  }

  async registerContents(contents: AnalyzedContent[]): Promise<void> {
    for (const c of contents) await this.store.saveContent(c);
  }

  async recordMetric(record: Omit<MetricRecord, 'recordedAt'> & { recordedAt?: Date }): Promise<void> {
    await this.store.appendMetric({ ...record, recordedAt: record.recordedAt ?? new Date() });
  }

  async recordMetrics(
    records: Array<Omit<MetricRecord, 'recordedAt'> & { recordedAt?: Date }>,
  ): Promise<void> {
    for (const r of records) await this.recordMetric(r);
  }

  async reportFor(tenantId: string, dimension: AnalyticsDimension): Promise<DimensionReport> {
    const extractor = DIMENSION_EXTRACTORS[dimension];
    const contents = (await this.store.listContents(tenantId)).filter((c) => extractor(c.metadata));
    const contentIds = new Set(contents.map((c) => c.id));
    const records = await this.store.getMetrics(tenantId);

    const { perContent } = aggregate(records, contentIds);
    const global = sumAndAverage(perContent);

    const bySegment = new Map<string, Set<string>>();
    for (const c of contents) {
      const segment = extractor(c.metadata)!;
      let set = bySegment.get(segment);
      if (!set) {
        set = new Set();
        bySegment.set(segment, set);
      }
      set.add(c.id);
    }

    const segments: SegmentAggregate[] = [];
    for (const [segment, ids] of bySegment) {
      const agg = sumAndAverage(perContent);
      // recompute restricted to segment contents
      const segPerContent = new Map<string, PerContentMetrics>();
      for (const id of ids) {
        const entry = perContent.get(id);
        if (entry) segPerContent.set(id, entry);
      }
      const restricted = sumAndAverage(segPerContent);
      segments.push({
        dimension,
        segment,
        contentCount: ids.size,
        totals: restricted.totals,
        averages: restricted.averages,
      });
      void agg;
    }

    segments.sort((a, b) => b.contentCount - a.contentCount || a.segment.localeCompare(b.segment));

    return {
      dimension,
      analyzedContents: contentIds.size,
      globalTotals: global.totals,
      globalAverages: global.averages,
      segments,
    };
  }
}
