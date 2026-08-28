import type { DomainProviderResolver } from './content-engine';

export interface PlanningScope {
  tenantId: string;
  projectId?: string;
  domain?: string;
}

export interface DailyTargetConfig extends PlanningScope {
  dailyTarget: number;
  enabled?: boolean;
}

export interface DailyPlanRequest extends PlanningScope {
  date: Date;
  contentTypes: string[];
  existingPlannedCount?: number;
  campaignId?: string;
  dailyTargetOverride?: number;
}

export interface PlannedContent {
  sequence: number;
  contentType: string;
  campaignId?: string;
}

export interface DailyPlan extends PlanningScope {
  date: Date;
  dailyTarget: number;
  existingPlannedCount: number;
  items: PlannedContent[];
}

export class ContentPlanner {
  private readonly dailyTargets: DailyTargetConfig[] = [];

  constructor(private readonly domains?: DomainProviderResolver) {}

  setDailyTarget(config: DailyTargetConfig): void {
    if (!Number.isInteger(config.dailyTarget) || config.dailyTarget < 0) {
      throw new Error('dailyTarget must be a non-negative integer.');
    }

    const existingIndex = this.dailyTargets.findIndex((target) =>
      target.tenantId === config.tenantId &&
      target.projectId === config.projectId &&
      target.domain === config.domain,
    );
    const next = { ...config, enabled: config.enabled ?? true };

    if (existingIndex >= 0) {
      this.dailyTargets[existingIndex] = next;
      return;
    }
    this.dailyTargets.push(next);
  }

  getDailyTarget(scope: PlanningScope): number {
    const candidates = this.dailyTargets
      .filter((target) => target.enabled !== false)
      .filter((target) => target.tenantId === scope.tenantId)
      .filter((target) => target.projectId === undefined || target.projectId === scope.projectId)
      .filter((target) => target.domain === undefined || target.domain === scope.domain)
      .sort((left, right) => this.specificity(right) - this.specificity(left));

    return candidates[0]?.dailyTarget ?? 0;
  }

  planDaily(request: DailyPlanRequest): DailyPlan {
    const dailyTarget = request.dailyTargetOverride ?? this.getDailyTarget(request);
    if (!Number.isInteger(dailyTarget) || dailyTarget < 0) {
      throw new Error('dailyTargetOverride must be a non-negative integer.');
    }
    const existingPlannedCount = request.existingPlannedCount ?? 0;
    const missingCount = Math.max(0, dailyTarget - existingPlannedCount);

    if (missingCount > 0 && request.contentTypes.length === 0) {
      throw new Error('At least one content type is required to plan content.');
    }

    return {
      tenantId: request.tenantId,
      projectId: request.projectId,
      domain: request.domain,
      date: request.date,
      dailyTarget,
      existingPlannedCount,
      items: Array.from({ length: missingCount }, (_, index) => ({
        sequence: existingPlannedCount + index + 1,
        contentType: request.contentTypes[index % request.contentTypes.length],
        campaignId: request.campaignId,
      })),
    };
  }

  async planDomainDaily(request: Omit<DailyPlanRequest, 'contentTypes'> & { domain: string }): Promise<DailyPlan> {
    const domain = this.domains?.getDomain(request.domain);
    if (!domain) {
      throw new Error(`Unknown domain: ${request.domain}`);
    }

    const contentTypes = (await domain.getContentTypes()).map((contentType) => contentType.id);
    return this.planDaily({ ...request, contentTypes });
  }

  private specificity(target: DailyTargetConfig): number {
    return Number(target.projectId !== undefined) + Number(target.domain !== undefined);
  }
}
