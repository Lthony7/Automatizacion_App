import type { AudioAsset } from './audio-engine';
import type { MediaAsset } from './media-engine';
import type { SubtitleFormat, SubtitleStyle } from './subtitle-engine';
import type { VideoTemplate, VideoTemplateLayer } from './template-engine';

export interface VideoContent {
  id: string;
  fields: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface MediaAssets {
  background?: MediaAsset;
  images?: MediaAsset[];
  videos?: MediaAsset[];
  music?: AudioAsset;
  logo?: MediaAsset;
}

export interface SubtitleTrack {
  format: SubtitleFormat;
  filePath: string;
  style?: SubtitleStyle;
}

export interface VideoOutput {
  width: 1080;
  height: 1920;
  fps: 30;
  videoCodec: 'libx264';
  audioCodec: 'aac';
  container: 'mp4';
}

export const VERTICAL_VIDEO_OUTPUT: VideoOutput = {
  width: 1080,
  height: 1920,
  fps: 30,
  videoCodec: 'libx264',
  audioCodec: 'aac',
  container: 'mp4',
};

export interface VideoRenderRequest {
  id: string;
  content: VideoContent;
  template: VideoTemplate;
  audio: AudioAsset;
  media: MediaAssets;
  subtitles?: SubtitleTrack;
  outputPath: string;
  output?: VideoOutput;
}

export interface FFmpegInput {
  role: 'background' | 'image' | 'video' | 'audio' | 'music' | 'logo';
  source: string;
  index: number;
}

export interface FFmpegRenderPlan {
  inputs: FFmpegInput[];
  filterComplex: string;
  args: string[];
  output: VideoOutput;
  expectedDurationMs: number;
}

export interface VideoRenderResult {
  outputPath: string;
  output: VideoOutput;
  durationMs: number;
}

export interface FFmpegExecutor {
  execute(plan: FFmpegRenderPlan): Promise<VideoRenderResult>;
}

/**
 * Domain-agnostic FFmpeg plan compiler. It only receives generic content,
 * template, audio, media, and subtitle structures.
 */
export class VideoEngine {
  buildPlan(request: VideoRenderRequest): FFmpegRenderPlan {
    const output = request.output ?? VERTICAL_VIDEO_OUTPUT;
    this.validateOutput(output);

    const args: string[] = ['-y'];
    const inputs: FFmpegInput[] = [];
    const addInput = (role: FFmpegInput['role'], source: string, isImage = false): number => {
      this.validateSourceUrl(source);
      if (source.startsWith('-')) throw new Error('Source must not start with "-"');
      const index = inputs.length;
      if (isImage) args.push('-loop', '1', '-framerate', '30');
      args.push('-i', source);
      inputs.push({ role, source, index });
      return index;
    };

    const backgroundIndex = request.media.background
      ? addInput('background', request.media.background.url, request.media.background.type === 'image')
      : this.addColorBackground(args, inputs, output);

    const imageIndexes = (request.media.images ?? []).map((asset) => addInput('image', asset.url, true));
    const videoIndexes = (request.media.videos ?? []).map((asset) => addInput('video', asset.url));
    const audioIndex = addInput('audio', request.audio.url);
    const musicIndex = request.media.music ? addInput('music', request.media.music.url) : undefined;
    const logoIndex = request.media.logo ? addInput('logo', request.media.logo.url, request.media.logo.type === 'image') : undefined;

    const filters: string[] = [`[${backgroundIndex}:v]scale=${output.width}:${output.height},fps=${output.fps}[v0]`];
    let videoLabel = 'v0';
    for (const index of imageIndexes) {
      const imageLabel = `image${index}`;
      const nextLabel = `v${index + 1}`;
      filters.push(`[${index}:v]scale=${output.width}:${output.height}:force_original_aspect_ratio=decrease[${imageLabel}]`);
      filters.push(`[${videoLabel}][${imageLabel}]overlay=(W-w)/2:(H-h)/2[${nextLabel}]`);
      videoLabel = nextLabel;
    }
    for (const index of videoIndexes) {
      const nextLabel = `v${index + 1}`;
      filters.push(`[${videoLabel}][${index}:v]overlay=(W-w)/2:(H-h)/2:shortest=1[${nextLabel}]`);
      videoLabel = nextLabel;
    }
    if (logoIndex !== undefined) {
      filters.push(`[${videoLabel}][${logoIndex}:v]overlay=W-w-40:40[vlogo]`);
      videoLabel = 'vlogo';
    }
    for (const layer of request.template.layers.filter((candidate) => candidate.type === 'text')) {
      const nextLabel = `vtext${layer.id.replace(/[^a-z0-9]/gi, '')}`;
      filters.push(this.drawTextFilter(videoLabel, nextLabel, layer, request.content));
      videoLabel = nextLabel;
    }
    if (request.subtitles) {
      const nextLabel = 'vsubtitles';
      filters.push(`[${videoLabel}]subtitles='${this.escapeFilterValue(request.subtitles.filePath)}'[${nextLabel}]`);
      videoLabel = nextLabel;
    }
    for (const transition of request.template.transitions ?? []) {
      const nextLabel = `${videoLabel}transition`;
      filters.push(`[${videoLabel}]fade=t=in:st=0:d=${transition.durationMs / 1000}[${nextLabel}]`);
      videoLabel = nextLabel;
    }

    let audioMap = `${audioIndex}:a`;
    if (musicIndex !== undefined) {
      filters.push(`[${audioIndex}:a][${musicIndex}:a]amix=inputs=2:duration=first[aout]`);
      audioMap = '[aout]';
    }
    this.validateOutputPath(request.outputPath);
    args.push(
      '-filter_complex', filters.join(';'),
      '-map', `[${videoLabel}]`,
      '-map', audioMap,
      '-c:v', output.videoCodec,
      '-r', String(output.fps),
      '-pix_fmt', 'yuv420p',
      '-c:a', output.audioCodec,
      '-movflags', '+faststart',
      '-shortest',
      '--',
      request.outputPath,
    );

    return {
      inputs,
      filterComplex: filters.join(';'),
      args,
      output,
      expectedDurationMs: request.audio.durationMs,
    };
  }

  async render(request: VideoRenderRequest, executor: FFmpegExecutor): Promise<VideoRenderResult> {
    return executor.execute(this.buildPlan(request));
  }

  private drawTextFilter(input: string, output: string, layer: VideoTemplateLayer, content: VideoContent): string {
    const text = this.escapeFilterValue(content.fields[layer.contentField as string] ?? '');
    const x = layer.x ?? 60;
    const y = layer.y ?? 160;
    return `[${input}]drawtext=text='${text}':x=${x}:y=${y}:fontsize=52:fontcolor=white[${output}]`;
  }

  private addColorBackground(args: string[], inputs: FFmpegInput[], output: VideoOutput): number {
    const index = inputs.length;
    const source = `color=c=black:s=${output.width}x${output.height}:r=${output.fps}`;
    args.push('-f', 'lavfi', '-i', source);
    inputs.push({ role: 'background', source, index });
    return index;
  }

  private validateOutput(output: VideoOutput): void {
    if (
      output.width !== 1080 || output.height !== 1920 || output.fps !== 30 ||
      output.videoCodec !== 'libx264' || output.audioCodec !== 'aac' || output.container !== 'mp4'
    ) {
      throw new Error('Video output must be 1080x1920, 30fps, H264, AAC, and MP4.');
    }
  }

  private validateSourceUrl(source: string): void {
    if (source.startsWith('color=')) return; // lavfi internal
    let url: URL;
    try { url = new URL(source); } catch { throw new Error(`Invalid media URL: ${source}`); }
    if (url.protocol !== 'https:') throw new Error('Media URL must be https');
    if (url.hostname === '169.254.169.254' || url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname.endsWith('.internal')) {
      throw new Error('Blocked internal URL');
    }
    if (source.startsWith('file://')) throw new Error('file:// not allowed');
  }

  private validateOutputPath(path: string): void {
    if (path.includes('..') || !path.endsWith('.mp4')) throw new Error('Invalid output path');
    // enforce tenant-scoped prefix in production: s3://bucket/{tenantId}/ or /tmp/{tenantId}/
    if (path.startsWith('-')) throw new Error('Output path must not start with "-"');
  }

  private escapeFilterValue(value: string): string {
    if (value.length > 500) throw new Error('Filter value too long');
    return value.replace(/([\\':;\[\]$%])/g, '\\$1');
  }
}
