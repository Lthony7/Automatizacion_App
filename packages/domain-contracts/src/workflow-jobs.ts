import type { RenderJob, RenderJobPayload, RenderJobQueue, RenderRetryPolicy } from './render-jobs';

export type WorkflowState =
  | 'DRAFT'
  | 'QUEUED'
  | 'GENERATING'
  | 'GENERATED'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'AUDIO_GENERATING'
  | 'AUDIO_GENERATED'
  | 'RENDERING'
  | 'RENDERED'
  | 'AI_REVIEW'
  | 'PENDING_APPROVAL'
  | 'EDITING'
  | 'REJECTED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED';

export type WorkflowTransition =
  | 'DRAFT_TO_QUEUED'
  | 'QUEUED_TO_GENERATING'
  | 'GENERATING_TO_GENERATED'
  | 'GENERATED_TO_VALIDATING'
  | 'VALIDATING_TO_VALIDATED'
  | 'VALIDATED_TO_AUDIO_GENERATING'
  | 'AUDIO_GENERATING_TO_AUDIO_GENERATED'
  | 'AUDIO_GENERATED_TO_RENDERING'
  | 'RENDERING_TO_RENDERED'
  | 'RENDERED_TO_AI_REVIEW'
  | 'AI_REVIEW_TO_PENDING_APPROVAL'
  | 'PENDING_APPROVAL_TO_APPROVED'
  | 'APPROVED_TO_SCHEDULED'
  | 'SCHEDULED_TO_PUBLISHING'
  | 'PUBLISHING_TO_PUBLISHED'
  | 'ANY_TO_FAILED'
  | 'FAILED_TO_CANCELLED'
  | 'CANCELLED_TO_DRAFT';

export interface WorkflowJobPayload {
  idempotencyKey: string;
  tenantId: string;
  projectId?: string;
  contentId?: string;
  workflowState: WorkflowState;
  workflowTransition: WorkflowTransition;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowRetryPolicy {
  attempts: number;
  backoffMs: number;
  maxElapsedMs?: number;
}

export const DEFAULT_WORKFLOW_RETRY_POLICY: WorkflowRetryPolicy = {
  attempts: 3,
  backoffMs: 2_000,
  maxElapsedMs: 30_000,
};

export interface WorkflowJob {
  id: string;
  idempotencyKey: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  payload: WorkflowJobPayload;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface WorkflowJobQueue {
  getByIdempotencyKey(idempotencyKey: string): Promise<WorkflowJob | undefined>;
  getByStatus(status: WorkflowState): Promise<WorkflowJob[]>;
  enqueue(payload: WorkflowJobPayload, retry?: Partial<WorkflowRetryPolicy>): Promise<{ job: WorkflowJob; reused: boolean }>;
  getJob(id: string): Promise<WorkflowJob | undefined>;
}

export interface WorkflowJobHandler {
  handle(payload: WorkflowJobPayload): Promise<{
    nextState: WorkflowState;
    transition: WorkflowTransition;
    valid: boolean;
    error?: string;
  }>;
}

export interface WorkflowService {
  validateTransition(from: WorkflowState, to: WorkflowState): boolean;
  getAllowedTransitions(state: WorkflowState): WorkflowTransition[];
  executeTransition(payload: WorkflowJobPayload): Promise<{
    success: boolean;
    nextState: WorkflowState;
    error?: string;
  }>;
}

export interface WorkflowJobService {
  enqueue(
    payload: WorkflowJobPayload,
    retry?: Partial<WorkflowRetryPolicy>,
  ): Promise<{ job: WorkflowJob; reused: boolean }>;
  getJobStatus(id: string): Promise<{ job: WorkflowJob | null; error?: string }>;
  getJobsByState(state: WorkflowState): Promise<WorkflowJob[]>;
  replayJob(id: string): Promise<{ success: boolean; job: WorkflowJob }>;
}