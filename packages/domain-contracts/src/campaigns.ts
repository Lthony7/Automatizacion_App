import type { PlanningScope } from './content-planner';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface Campaign extends PlanningScope {
  id: string;
  name: string;
  status: CampaignStatus;
  dailyTargetOverride?: number;
  contentTypeDistribution?: Record<string, number>;
  startsAt?: Date;
  endsAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignInput extends PlanningScope {
  id: string;
  name: string;
  dailyTargetOverride?: number;
  contentTypeDistribution?: Record<string, number>;
  startsAt?: Date;
  endsAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface CampaignRepository {
  create(campaign: Campaign): Promise<Campaign>;
  findById(id: string, tenantId: string): Promise<Campaign | undefined>;
  list(scope: PlanningScope): Promise<Campaign[]>;
  save(campaign: Campaign): Promise<Campaign>;
}

export class CampaignService {
  constructor(private readonly campaigns: CampaignRepository) {}

  async create(input: CreateCampaignInput): Promise<Campaign> {
    if (!input.name.trim()) {
      throw new Error('Campaign name is required.');
    }
    if (input.dailyTargetOverride !== undefined && (!Number.isInteger(input.dailyTargetOverride) || input.dailyTargetOverride < 0)) {
      throw new Error('dailyTargetOverride must be a non-negative integer.');
    }
    if (input.startsAt && input.endsAt && input.endsAt < input.startsAt) {
      throw new Error('Campaign end date must be on or after its start date.');
    }

    const now = new Date();
    return this.campaigns.create({
      ...input,
      status: 'DRAFT',
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  async setStatus(id: string, tenantId: string, status: CampaignStatus): Promise<Campaign> {
    const campaign = await this.campaigns.findById(id, tenantId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${id}`);
    }

    return this.campaigns.save({ ...campaign, status, updatedAt: new Date() });
  }

  async list(scope: PlanningScope): Promise<Campaign[]> {
    return this.campaigns.list(scope);
  }
}

export class InMemoryCampaignRepository implements CampaignRepository {
  private readonly campaigns = new Map<string, Campaign>();

  async create(campaign: Campaign): Promise<Campaign> {
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async findById(id: string, tenantId: string): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    return campaign?.tenantId === tenantId ? campaign : undefined;
  }

  async list(scope: PlanningScope): Promise<Campaign[]> {
    return [...this.campaigns.values()].filter((campaign) =>
      campaign.tenantId === scope.tenantId &&
      (scope.projectId === undefined || campaign.projectId === scope.projectId) &&
      (scope.domain === undefined || campaign.domain === scope.domain),
    );
  }

  async save(campaign: Campaign): Promise<Campaign> {
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }
}
