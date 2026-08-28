import type { SocialAccount, PublicationRequest, PublicationResult, Publisher, SocialPlatform } from './social-publisher';
import type { WorkflowState } from './workflow-jobs';

export type PublicationJobStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED';

export interface PublicationJob {
  id: string;
  idempotencyKey: string;
  contentId: string;
  tenantId: string;
  platform: SocialPlatform;
  status: PublicationJobStatus;
  request: PublicationRequest;
  result?: PublicationResult;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

/** In-memory store for idempotent publication. Persists across restarts via DB in production. */
export interface PublicationJobStore {
  getByIdempotencyKey(key: string): Promise<PublicationJob | undefined>;
  save(job: PublicationJob): Promise<void>;
  getByContentAndPlatform(contentId: string, platform: SocialPlatform): Promise<PublicationJob | undefined>;
}

export function createInMemoryPublicationJobStore(): PublicationJobStore {
  const jobs = new Map<string, PublicationJob>();
  return {
    async getByIdempotencyKey(key: string) {
      return Array.from(jobs.values()).find((j) => j.idempotencyKey === key);
    },
    async save(job: PublicationJob) {
      jobs.set(job.idempotencyKey, job);
    },
    async getByContentAndPlatform(contentId: string, platform: SocialPlatform) {
      return Array.from(jobs.values()).find(
        (j) => j.contentId === contentId && j.platform === platform,
      );
    },
  };
}

/** Allowed transitions for the publication pipeline. */
const PUBLICATION_TRANSITIONS: Record<PublicationJobStatus, PublicationJobStatus[]> = {
  PENDING: ['APPROVED', 'CANCELLED'],
  APPROVED: ['SCHEDULED', 'PUBLISHING', 'CANCELLED'],
  SCHEDULED: ['PUBLISHING', 'CANCELLED'],
  PUBLISHING: ['PUBLISHED', 'FAILED'],
  PUBLISHED: [],
  FAILED: ['PENDING'], // retry
  CANCELLED: ['PENDING'], // retry
};

function canTransition(from: PublicationJobStatus, to: PublicationJobStatus): boolean {
  return PUBLICATION_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Publication Engine: orchestrates the pipeline from APPROVED → PUBLISHED.
 * Enforces idempotency, prevents duplicate publications, and verifies content status. */
export class PublicationEngine {
  private readonly publishers = new Map<SocialPlatform, Publisher>();

  constructor(
    private readonly jobStore: PublicationJobStore,
    publishers?: Publisher[],
  ) {
    if (publishers) {
      for (const p of publishers) {
        this.publishers.set(p.platform, p);
      }
    }
  }

  registerPublisher(publisher: Publisher) {
    this.publishers.set(publisher.platform, publisher);
  }

  /** Check if a content can be published. Must be APPROVED or higher in the workflow. */
  async canPublish(
    contentId: string,
    platform: SocialPlatform,
    workflowState: WorkflowState,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Verify workflow state allows publication
    if (workflowState !== 'APPROVED' && workflowState !== 'SCHEDULED') {
      return {
        allowed: false,
        reason: `Workflow state "${workflowState}" does not allow publication. Must be APPROVED or SCHEDULED.`,
      };
    }

    // Check for existing publication job (idempotency)
    const existing = await this.jobStore.getByContentAndPlatform(contentId, platform);
    if (existing && existing.status === 'PUBLISHED') {
      return {
        allowed: false,
        reason: `Content already published on ${platform} (postId: ${existing.result?.postId})`,
      };
    }

    // Check publisher is registered
    if (!this.publishers.has(platform)) {
      return {
        allowed: false,
        reason: `No publisher registered for platform "${platform}"`,
      };
    }

    return { allowed: true };
  }

  /** Schedule a publication job. Idempotent: same key returns existing job. */
  async schedule(request: PublicationRequest, account: SocialAccount): Promise<PublicationJob> {
    // Check for existing job with same idempotency key
    const existing = await this.jobStore.getByIdempotencyKey(request.idempotencyKey);
    if (existing) {
      return existing; // Already scheduled or published
    }

    const job: PublicationJob = {
      id: `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      idempotencyKey: request.idempotencyKey,
      contentId: request.contentId,
      tenantId: request.tenantId,
      platform: request.platform,
      status: 'SCHEDULED',
      request,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.jobStore.save(job);
    return job;
  }

  /** Execute publication: SCHEDULED → PUBLISHING → PUBLISHED/FAILED.
   * Verifies APPROVED status before publishing. */
  async publish(
    job: PublicationJob,
    account: SocialAccount,
    workflowState: WorkflowState,
  ): Promise<{ job: PublicationJob; result: PublicationResult }> {
    // Step 1: Verify content is APPROVED
    if (workflowState !== 'APPROVED' && workflowState !== 'SCHEDULED') {
      const error = `Cannot publish: content workflow state is "${workflowState}", must be APPROVED or SCHEDULED`;
      job.status = 'FAILED';
      job.updatedAt = new Date();
      job.result = {
        success: false,
        publishedAt: new Date(),
        platform: job.platform,
        idempotencyKey: job.idempotencyKey,
        error,
      };
      await this.jobStore.save(job);
      return { job, result: job.result };
    }

    // Step 2: Transition to PUBLISHING
    if (!canTransition(job.status, 'PUBLISHING')) {
      const error = `Cannot transition from "${job.status}" to "PUBLISHING"`;
      job.status = 'FAILED';
      job.updatedAt = new Date();
      job.result = {
        success: false,
        publishedAt: new Date(),
        platform: job.platform,
        idempotencyKey: job.idempotencyKey,
        error,
      };
      await this.jobStore.save(job);
      return { job, result: job.result };
    }

    job.status = 'PUBLISHING';
    job.updatedAt = new Date();
    await this.jobStore.save(job);

    // Step 3: Execute publication
    const publisher = this.publishers.get(job.platform);
    if (!publisher) {
      const error = `No publisher for platform "${job.platform}"`;
      job.status = 'FAILED';
      job.updatedAt = new Date();
      job.result = {
        success: false,
        publishedAt: new Date(),
        platform: job.platform,
        idempotencyKey: job.idempotencyKey,
        error,
      };
      await this.jobStore.save(job);
      return { job, result: job.result };
    }

    try {
      const result = await publisher.publish(job.request, account);
      job.result = result;
      job.status = result.success ? 'PUBLISHED' : 'FAILED';
      if (result.success) {
        job.publishedAt = result.publishedAt;
      }
    } catch (err) {
      job.status = 'FAILED';
      job.result = {
        success: false,
        publishedAt: new Date(),
        platform: job.platform,
        idempotencyKey: job.idempotencyKey,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    job.updatedAt = new Date();
    await this.jobStore.save(job);
    return { job, result: job.result! };
  }
}
