import { Queue, Worker, type Job, type WorkerOptions } from 'bullmq';
import type {
  WorkflowJob,
  WorkflowJobPayload,
  WorkflowJobQueue,
  WorkflowRetryPolicy,
  WorkflowState,
  WorkflowJobHandler,
} from 'domain-contracts/workflow-jobs';
import { DEFAULT_WORKFLOW_RETRY_POLICY } from 'domain-contracts/workflow-jobs';

const WORKFLOW_JOB_NAME = 'workflow';

/** BullMQ infrastructure adapter for workflow jobs. Core depends only on WorkflowJobQueue. */
export class BullMQWorkflowJobQueue implements WorkflowJobQueue {
  constructor(private readonly queue: Queue<WorkflowJobPayload>) {}

  async getByIdempotencyKey(idempotencyKey: string): Promise<WorkflowJob | undefined> {
    const job = await this.queue.getJob(idempotencyKey);
    return job ? await this.toWorkflowJob(job) : undefined;
  }

  async getByStatus(status: WorkflowState): Promise<WorkflowJob[]> {
    // BullMQ stores lifecycle states; map the domain state filter onto them.
    const bullStates =
      status === 'PUBLISHED' || status === 'GENERATED'
        ? ['completed']
        : ['waiting', 'active', 'delayed', 'failed'];
    const jobs = await this.queue.getJobs(bullStates as any[]);
    const mapped = await Promise.all(jobs.filter(Boolean).map((j) => this.toWorkflowJob(j)));
    return mapped.filter((j) => j.payload.workflowState === status);
  }

  async getJob(id: string): Promise<WorkflowJob | undefined> {
    return this.getByIdempotencyKey(id);
  }

  async enqueue(payload: WorkflowJobPayload, retry?: Partial<WorkflowRetryPolicy>): Promise<{ job: WorkflowJob; reused: boolean }> {
    const effectiveRetry = {
      attempts: retry?.attempts ?? DEFAULT_WORKFLOW_RETRY_POLICY.attempts,
      backoffMs: retry?.backoffMs ?? DEFAULT_WORKFLOW_RETRY_POLICY.backoffMs,
      maxElapsedMs: retry?.maxElapsedMs,
    };

    const job = await this.queue.add(WORKFLOW_JOB_NAME, payload, {
      jobId: payload.idempotencyKey,
      attempts: effectiveRetry.attempts,
      backoff: {
        type: 'exponential',
        delay: effectiveRetry.backoffMs,
      },
      // Retention: completed jobs kept 1h for debugging, failures 24h for postmortems.
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    });

    return { job: await this.toWorkflowJob(job), reused: false };
  }

  private async toWorkflowJob(job: Job<WorkflowJobPayload>): Promise<WorkflowJob> {
    const attempts = job.opts.attempts ?? 1;
    const jobState = await job.getState();
    return {
      id: job.id as string,
      idempotencyKey: job.data.idempotencyKey,
      status:
        jobState === 'completed'
          ? 'COMPLETED'
          : jobState === 'failed'
            ? 'FAILED'
            : jobState === 'active'
              ? 'PROCESSING'
              : 'QUEUED',
      attempts,
      payload: job.data,
      createdAt: new Date(job.timestamp ?? Date.now()),
      updatedAt: job.processedOn ? new Date(job.processedOn) : new Date(),
      completedAt: jobState === 'completed' ? new Date() : undefined,
    };
  }
}

/** Worker for workflow jobs. */
export function createWorkflowWorker(
  queueName: string,
  connection: WorkerOptions['connection'],
  handler: WorkflowJobHandler,
): Worker<WorkflowJobPayload, any> {
  return new Worker<WorkflowJobPayload, any>(
    queueName,
    async (job) => handler.handle(job.data),
    { connection },
  );
}

/** Creates workflow workers for all 9 queues.
 * Accepts BullMQ Queue instances (infrastructure type — this is the adapter layer)
 * plus a single shared connection; the port type WorkflowJobQueue intentionally
 * has no `connection`, so we never read it from the port. */
export function createWorkflowService(
  queues: {
    contentGeneration: Queue<WorkflowJobPayload>;
    domainValidation: Queue<WorkflowJobPayload>;
    audioGeneration: Queue<WorkflowJobPayload>;
    videoRender: Queue<WorkflowJobPayload>;
    aiReview: Queue<WorkflowJobPayload>;
    publication: Queue<WorkflowJobPayload>;
    analytics: Queue<WorkflowJobPayload>;
    notifications: Queue<WorkflowJobPayload>;
    cleanup: Queue<WorkflowJobPayload>;
  },
  connection: WorkerOptions['connection'],
  handlers: {
    contentGeneration: WorkflowJobHandler;
    domainValidation: WorkflowJobHandler;
    audioGeneration: WorkflowJobHandler;
    videoRender: WorkflowJobHandler;
    aiReview: WorkflowJobHandler;
    publication: WorkflowJobHandler;
    analytics: WorkflowJobHandler;
    notifications: WorkflowJobHandler;
    cleanup: WorkflowJobHandler;
  },
) {
  const workers = {
    contentGeneration: createWorkflowWorker(queues.contentGeneration.name, connection, handlers.contentGeneration),
    domainValidation: createWorkflowWorker(queues.domainValidation.name, connection, handlers.domainValidation),
    audioGeneration: createWorkflowWorker(queues.audioGeneration.name, connection, handlers.audioGeneration),
    videoRender: createWorkflowWorker(queues.videoRender.name, connection, handlers.videoRender),
    aiReview: createWorkflowWorker(queues.aiReview.name, connection, handlers.aiReview),
    publication: createWorkflowWorker(queues.publication.name, connection, handlers.publication),
    analytics: createWorkflowWorker(queues.analytics.name, connection, handlers.analytics),
    notifications: createWorkflowWorker(queues.notifications.name, connection, handlers.notifications),
    cleanup: createWorkflowWorker(queues.cleanup.name, connection, handlers.cleanup),
  };

  return { workers };
}