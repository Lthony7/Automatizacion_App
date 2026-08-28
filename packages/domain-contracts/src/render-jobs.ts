import type { VideoRenderRequest, VideoRenderResult } from './video-engine';

export interface RenderRetryPolicy {
  attempts: number;
  backoffMs: number;
}

export interface RenderJobPayload {
  idempotencyKey: string;
  tenantId: string;
  projectId?: string;
  render: VideoRenderRequest;
  retry?: Partial<RenderRetryPolicy>;
}

export interface RenderJob {
  id: string;
  idempotencyKey: string;
  status: 'QUEUED' | 'RENDERING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  payload: RenderJobPayload;
}

export interface RenderJobQueue {
  getByIdempotencyKey(idempotencyKey: string): Promise<RenderJob | undefined>;
  enqueue(payload: RenderJobPayload, retry: RenderRetryPolicy): Promise<RenderJob>;
}

export interface RenderJobHandler {
  render(payload: RenderJobPayload): Promise<VideoRenderResult>;
}

export const DEFAULT_RENDER_RETRY_POLICY: RenderRetryPolicy = {
  attempts: 3,
  backoffMs: 1_000,
};

/** Enforces durable idempotency through a queue implementation. */
export class RenderJobService {
  constructor(private readonly queue: RenderJobQueue) {}

  async enqueue(payload: RenderJobPayload): Promise<{ job: RenderJob; reused: boolean }> {
    if (!payload.idempotencyKey.trim()) {
      throw new Error('Render jobs require an idempotency key.');
    }
    const existing = await this.queue.getByIdempotencyKey(payload.idempotencyKey);
    if (existing) {
      return { job: existing, reused: true };
    }
    const retry = {
      attempts: payload.retry?.attempts ?? DEFAULT_RENDER_RETRY_POLICY.attempts,
      backoffMs: payload.retry?.backoffMs ?? DEFAULT_RENDER_RETRY_POLICY.backoffMs,
    };
    if (!Number.isInteger(retry.attempts) || retry.attempts < 1 || retry.backoffMs < 0) {
      throw new Error('Render retry policy is invalid.');
    }
    return { job: await this.queue.enqueue(payload, retry), reused: false };
  }
}

export class InMemoryRenderJobQueue implements RenderJobQueue {
  private readonly jobs = new Map<string, RenderJob>();

  async getByIdempotencyKey(idempotencyKey: string): Promise<RenderJob | undefined> {
    return this.jobs.get(idempotencyKey);
  }

  async enqueue(payload: RenderJobPayload, retry: RenderRetryPolicy): Promise<RenderJob> {
    const existing = this.jobs.get(payload.idempotencyKey);
    if (existing) return existing;
    const job: RenderJob = {
      id: payload.idempotencyKey,
      idempotencyKey: payload.idempotencyKey,
      status: 'QUEUED',
      attempts: retry.attempts,
      payload,
    };
    this.jobs.set(payload.idempotencyKey, job);
    return job;
  }
}
