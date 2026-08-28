import { spawn } from 'node:child_process';
import type { FFmpegExecutor, FFmpegRenderPlan, VideoRenderResult } from 'domain-contracts/video-engine';

/**
 * Executes a provider-agnostic FFmpeg render plan using the configured binary.
 *
 * H-04 (timeout): the process is hard-killed after a deadline derived from the
 * expected video duration (2× expected duration + 60s overhead floor), with a
 * configurable cap. Cleanup is guaranteed — no orphaned ffmpeg processes.
 */
export class NodeFFmpegExecutor implements FFmpegExecutor {
  constructor(
    private readonly binaryPath = 'ffmpeg',
    private readonly timeoutMs: number = Number(process.env.FFMPEG_TIMEOUT_MS || 0) || undefined as unknown as number,
    private readonly maxTimeoutMs: number = Number(process.env.FFMPEG_MAX_TIMEOUT_MS || 30 * 60_000),
  ) {}

  /** Deadline scales with expected duration; bounded by maxTimeoutMs. */
  resolveTimeoutMs(plan: FFmpegRenderPlan): number {
    const durationBased = Math.min(plan.expectedDurationMs * 2 + 60_000, this.maxTimeoutMs);
    return Math.max(30_000, Math.min(this.timeoutMs ?? durationBased, durationBased));
  }

  async execute(plan: FFmpegRenderPlan): Promise<VideoRenderResult> {
    const timeoutMs = this.resolveTimeoutMs(plan);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(this.binaryPath, plan.args, { stdio: ['ignore', 'ignore', 'pipe'] });
      let stderr = '';
      let settled = false;

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(killer);
        fn();
      };

      // Guaranteed cleanup: SIGKILL after grace period on timeout
      const killer = setTimeout(() => {
        child.kill('SIGTERM');
        const forceKill = setTimeout(() => child.kill('SIGKILL'), 5_000);
        (forceKill as any).unref?.();
      }, timeoutMs);
      (killer as any).unref?.();

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.once('error', (err) => finish(() => reject(err)));
      child.once('close', (code, signal) => {
        finish(() => {
          if (signal === 'SIGTERM' || signal === 'SIGKILL') {
            reject(new Error(`FFmpeg render timed out after ${Math.round(timeoutMs / 1000)}s`));
            return;
          }
          if (code === 0) {
            resolve();
            return;
          }
          reject(new Error(`FFmpeg render failed with exit code ${code}: ${stderr}`));
        });
      });
    });

    return {
      outputPath: plan.args[plan.args.length - 1],
      output: plan.output,
      durationMs: plan.expectedDurationMs,
    };
  }
}
