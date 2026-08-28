import { CampaignService, InMemoryCampaignRepository } from '../src/campaigns';
import { ContentEngine } from '../src/content-engine';
import { ContentPlanner } from '../src/content-planner';

describe('FASE 7 Content Engine, Planner, and Campaigns', () => {
  const generatedFields = {
    hook: 'Start with a practical maintenance tip.',
    title: 'How to check engine oil',
    script: 'Park on level ground, wait for the engine to cool, and use the dipstick.',
    description: 'A short oil-check guide.',
    cta: 'Follow for more maintenance tips.',
    hashtags: ['#maintenance', '#automotive'],
    references: ['Owner manual'],
    metadata: { format: 'short_video' },
  };

  function createDomain(validationStatus: 'VALID' | 'WARNING' | 'INVALID' = 'VALID') {
    return {
      getContentTypes: jest.fn().mockResolvedValue([
        { id: 'maintenance_tip', name: 'maintenance_tip', displayName: 'Maintenance tip', description: 'Tip', vertical: 'automotive' },
        { id: 'diagnosis', name: 'diagnosis', displayName: 'Diagnosis', description: 'Diagnosis', vertical: 'automotive' },
      ]),
      getPromptProvider: jest.fn().mockReturnValue({
        getPrompt: jest.fn().mockImplementation(async (_contentType: string, variables: Record<string, string>) =>
          `Create a concise maintenance_tip about ${variables.idea}.`,
        ),
      }),
      getValidator: jest.fn().mockReturnValue({
        validate: jest.fn().mockResolvedValue({ status: validationStatus, errors: validationStatus === 'INVALID' ? ['Invalid content'] : [], warnings: [] }),
      }),
    };
  }

  test('runs the generic Idea -> Type -> Prompt -> AI -> Validation pipeline', async () => {
    const domain = createDomain();
    const ai = { generate: jest.fn().mockResolvedValue(generatedFields) };
    const engine = new ContentEngine({ getDomain: jest.fn().mockReturnValue(domain) } as any, ai);

    const result = await engine.generate({
      id: 'content-1',
      tenantId: 'tenant-1',
      projectId: 'project-1',
      domain: 'automotive',
      contentType: 'maintenance_tip',
      campaignId: 'campaign-1',
      idea: { text: 'checking engine oil' },
    });

    expect(result.status).toBe('VALIDATED');
    expect(result.content).toMatchObject({
      id: 'content-1',
      tenantId: 'tenant-1',
      projectId: 'project-1',
      domain: 'automotive',
      contentType: 'maintenance_tip',
      campaignId: 'campaign-1',
      ...generatedFields,
    });
    expect(ai.generate).toHaveBeenCalledWith(expect.objectContaining({
      domain: 'automotive',
      contentType: 'maintenance_tip',
      prompt: expect.stringContaining('checking engine oil'),
    }));
  });

  test('returns INVALID when the selected domain rejects generated content', async () => {
    const engine = new ContentEngine(
      { getDomain: jest.fn().mockReturnValue(createDomain('INVALID')) } as any,
      { generate: jest.fn().mockResolvedValue(generatedFields) },
    );

    const result = await engine.generate({
      id: 'content-2',
      tenantId: 'tenant-1',
      domain: 'automotive',
      contentType: 'maintenance_tip',
      idea: { text: 'checking engine oil' },
    });

    expect(result.status).toBe('INVALID');
    expect(result.validation.errors).toContain('Invalid content');
  });

  test('plans the remaining daily target using the most-specific tenant/project/domain configuration', () => {
    const planner = new ContentPlanner();
    planner.setDailyTarget({ tenantId: 'tenant-1', dailyTarget: 2 });
    planner.setDailyTarget({ tenantId: 'tenant-1', domain: 'automotive', dailyTarget: 3 });
    planner.setDailyTarget({ tenantId: 'tenant-1', projectId: 'project-1', domain: 'automotive', dailyTarget: 5 });

    const plan = planner.planDaily({
      tenantId: 'tenant-1',
      projectId: 'project-1',
      domain: 'automotive',
      date: new Date('2026-08-24T00:00:00.000Z'),
      contentTypes: ['maintenance_tip', 'diagnosis'],
      existingPlannedCount: 2,
    });

    expect(plan.dailyTarget).toBe(5);
    expect(plan.items).toHaveLength(3);
    expect(plan.items.map((item) => item.contentType)).toEqual(['maintenance_tip', 'diagnosis', 'maintenance_tip']);
  });

  test('creates tenant-scoped campaigns and applies their target override to a plan', async () => {
    const campaigns = new CampaignService(new InMemoryCampaignRepository());
    const campaign = await campaigns.create({
      id: 'campaign-1',
      tenantId: 'tenant-1',
      projectId: 'project-1',
      domain: 'automotive',
      name: 'Five videos per day',
      dailyTargetOverride: 5,
    });
    const activeCampaign = await campaigns.setStatus(campaign.id, 'tenant-1', 'ACTIVE');
    const planner = new ContentPlanner();

    const plan = planner.planDaily({
      tenantId: activeCampaign.tenantId,
      projectId: activeCampaign.projectId,
      domain: activeCampaign.domain,
      date: new Date('2026-08-24T00:00:00.000Z'),
      contentTypes: ['maintenance_tip'],
      campaignId: activeCampaign.id,
      dailyTargetOverride: activeCampaign.dailyTargetOverride,
    });

    expect(activeCampaign.status).toBe('ACTIVE');
    expect((await campaigns.list({ tenantId: 'tenant-1', projectId: 'project-1', domain: 'automotive' }))).toHaveLength(1);
    expect(plan.items).toHaveLength(5);
    expect(plan.items.every((item) => item.campaignId === 'campaign-1')).toBe(true);
  });
});
