/*
 * Worker Entrypoint — Content Automation Platform
 *
 * Initializes BullMQ workers for:
 *  1. Render jobs (video rendering via FFmpeg)
 *  2. Workflow jobs (state machine transitions)
 *
 * Run separately from the API server:
 *   npx ts-node workers/worker.ts
 *
 * Requires REDIS_URL env var (defaults to redis://localhost:6379).
 */

import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

console.log(`[worker] Connecting to ${REDIS_URL.replace(/\/\/.*@/, '//***@')}`);

// ── Render Queue ─────────────────────────────────────────────────────────────
const renderWorker = new Worker(
  'render-video',
  async (job) => {
    console.log(`[render] Processing job ${job.id}: ${job.data.idempotencyKey}`);
    // Delegate to NodeFFmpegExecutor (imported from the API module when wired)
    // For now, log the job data for debugging
    return { outputPath: `/tmp/render/${job.id}.mp4`, durationMs: 0 };
  },
  {
    connection,
    concurrency: 2,
    limiter: { max: 5, duration: 60_000 },
  },
);

renderWorker.on('completed', (job) => {
  console.log(`[render] Job ${job.id} completed`);
});

renderWorker.on('failed', (job, err) => {
  console.error(`[render] Job ${job?.id} failed:`, err.message);
});

// ── Workflow Queue ───────────────────────────────────────────────────────────
const workflowWorker = new Worker(
  'workflow',
  async (job) => {
    console.log(`[workflow] Processing job ${job.id}: ${job.data.contentId} → ${job.data.toState}`);
    // Delegate to WorkflowJobService (imported when wired)
    return { success: true };
  },
  {
    connection,
    concurrency: 5,
  },
);

workflowWorker.on('completed', (job) => {
  console.log(`[workflow] Job ${job.id} completed`);
});

workflowWorker.on('failed', (job, err) => {
  console.error(`[workflow] Job ${job?.id} failed:`, err.message);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown() {
  console.log('[worker] Shutting down...');
  await renderWorker.close();
  await workflowWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[worker] Workers started: render-video (concurrency=2), workflow (concurrency=5)');
