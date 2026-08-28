import { Queue, Worker, type Job, type WorkerOptions } from 'bullmq';
import type {
  RenderJob,
  RenderJobHandler,
  RenderJobPayload,
  RenderJobQueue,
  RenderRetryPolicy,
} from '../../../../../packages/domain-contracts/src/render-jobs';
import type { VideoRenderResult } from '../../../../../packages/domain-contracts/src/video-engine';

const RENDER_JOB_NAME = 'render-video';

/** BullMQ infrastructure adapter. Core depends only on RenderJobQueue. */
export class BullMQRenderJobQueue implements RenderJobQueue {
  constructor(private readonly queue: Queue<RenderJobPayload>) {}

  async getByIdempotencyKey(idempotencyKey: string): Promise<RenderJob | undefined> {
    const job = await this.queue.getJob(idempotencyKey);
    return job ? this.toRenderJob(job) : undefined;
  }

  async enqueue(payload: RenderJobPayload, retry: RenderRetryPolicy): Promise<RenderJob> {
    const job = await this.queue.add(RENDER_JOB_NAME, payload, {
      jobId: payload.idempotencyKey,
      attempts: retry.attempts,
      backoff: { type: 'exponential', delay: retry.backoffMs },
      removeOnComplete: false,
      removeOnFail: false,
    });
    return this.toRenderJob(job);
  }

  private async toRenderJob(job: Job<RenderJobPayload>): Promise<RenderJob> {
    const state = await job.getState();
    return {
      id: job.id as string,
      idempotencyKey: job.data.idempotencyKey,
      status: state === 'completed' ? 'COMPLETED' : state === 'failed' ? 'FAILED' : state === 'active' ? 'RENDERING' : 'QUEUED',
      attempts: job.opts.attempts ?? 1,
      payload: job.data,
    };
  }
}

export function createBullMQRenderWorker(
  queueName: string,
  connection: WorkerOptions['connection'],
  handler: RenderJobHandler,
): Worker<RenderJobPayload, VideoRenderResult> {
  return new Worker<RenderJobPayload, VideoRenderResult>(
    queueName,
    async (job) => handler.render(job.data),
    { connection },
  );
}
