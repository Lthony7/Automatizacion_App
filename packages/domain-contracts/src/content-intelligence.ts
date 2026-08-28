/**
 * FASE 13: Content Intelligence.
 *
 * Generates recommendations from generic analytics aggregates.
 * The algorithm is data-driven and vertical-agnostic:
 * it never references Bible/Christian/Automotive concepts.
 * Verticals influence results ONLY through the generic metadata
 * they attach to content records.
 */
import {
  AnalyticsEngine,
  ALL_DIMENSIONS,
  ALL_METRICS,
  type AnalyticsDimension,
  type DimensionReport,
  type MetricType,
} from './analytics-engine';

export interface InsightOptions {
  metrics?: MetricType[];
  dimensions?: AnalyticsDimension[];
  /** Minimum contents in a segment to consider it (avoids noise). Default 3. */
  minSampleSize?: number;
  /** Minimum lift vs global average, in percent. Default 10. */
  minLiftPct?: number;
  limit?: number;
}

export interface InsightRecommendation {
  dimension: AnalyticsDimension;
  segment: string;
  segmentLabel: string;
  dimensionLabel: string;
  metric: MetricType;
  average: number;
  globalAverage: number;
  liftPct: number;
  sampleSize: number;
  message: string;
}

/** Generic Spanish phrases per metric — no domain vocabulary involved. */
const METRIC_PHRASES: Record<MetricType, string> = {
  views: 'mejor rendimiento',
  likes: 'más "me gusta"',
  comments: 'más comentarios',
  shares: 'más compartidos',
  followers: 'más seguidores ganados',
  watch_time_seconds: 'mayor tiempo de visualización',
  retention_rate: 'mayor retención',
};

const DIMENSION_LABELS: Record<AnalyticsDimension, string> = {
  vertical: 'vertical',
  content_type: 'tipo de contenido',
  template: 'plantilla',
  hook: 'gancho',
  duration: 'duración',
  publication_time: 'hora de publicación',
  platform: 'plataforma',
};

function humanizeSegment(segment: string): string {
  return segment.replace(/_/g, ' ');
}

function buildMessage(dimension: AnalyticsDimension, segment: string, metric: MetricType, liftPct: number): string {
  const phrase = METRIC_PHRASES[metric];
  const dimLabel = DIMENSION_LABELS[dimension];
  const segLabel = humanizeSegment(segment);
  return `${capitalize(segLabel)} muestra ${phrase} en ${dimLabel} (+${liftPct.toFixed(0)}% vs promedio).`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export class ContentIntelligence {
  constructor(private readonly engine: AnalyticsEngine) {}

  /**
   * Generic recommendation algorithm:
   * for each dimension x metric, pick the segment with the highest average,
   * provided the segment has enough samples and beats the global average
   * by at least minLiftPct. Recommendations are ranked by lift.
   */
  async recommend(tenantId: string, options: InsightOptions = {}): Promise<InsightRecommendation[]> {
    const dimensions = options.dimensions ?? [...ALL_DIMENSIONS];
    const metrics = options.metrics ?? (['views', 'retention_rate', 'watch_time_seconds', 'likes', 'shares', 'comments'] as MetricType[]);
    const minSampleSize = options.minSampleSize ?? 3;
    const minLiftPct = options.minLiftPct ?? 10;
    const limit = options.limit ?? 5;

    const reports: DimensionReport[] = [];
    for (const dimension of dimensions) {
      if (!ALL_DIMENSIONS.includes(dimension)) continue;
      reports.push(await this.engine.reportFor(tenantId, dimension));
    }

    const recommendations: InsightRecommendation[] = [];
    for (const report of reports) {
      if (report.segments.length === 0 || report.analyzedContents < minSampleSize) continue;

      const qualifying = report.segments.filter((s) => s.contentCount >= minSampleSize);
      if (qualifying.length === 0) continue;

      // Weighted baseline computed over qualifying segments only,
      // so tiny outlier segments cannot poison the comparison.
      const baselines: Partial<Record<MetricType, number>> = {};
      for (const metric of metrics) {
        let sum = 0;
        let count = 0;
        for (const segment of qualifying) {
          const avg = segment.averages[metric];
          if (avg === undefined) continue;
          sum += avg * segment.contentCount;
          count += segment.contentCount;
        }
        if (count > 0) baselines[metric] = sum / count;
      }

      for (const metric of metrics) {
        const baselineAvg = baselines[metric];
        if (baselineAvg === undefined || baselineAvg <= 0) continue;

        let best: { segment: string; avg: number; count: number } | null = null;
        for (const segment of qualifying) {
          const avg = segment.averages[metric];
          if (avg === undefined) continue;
          if (!best || avg > best.avg) best = { segment: segment.segment, avg, count: segment.contentCount };
        }
        if (!best) continue;

        const liftPct = ((best.avg - baselineAvg) / baselineAvg) * 100;
        if (liftPct < minLiftPct) continue;

        recommendations.push({
          dimension: report.dimension,
          segment: best.segment,
          segmentLabel: humanizeSegment(best.segment),
          dimensionLabel: DIMENSION_LABELS[report.dimension],
          metric,
          average: best.avg,
          globalAverage: baselineAvg,
          liftPct,
          sampleSize: best.count,
          message: buildMessage(report.dimension, best.segment, metric, liftPct),
        });
      }
    }

    recommendations.sort((a, b) => b.liftPct - a.liftPct);
    return recommendations.slice(0, limit);
  }
}
