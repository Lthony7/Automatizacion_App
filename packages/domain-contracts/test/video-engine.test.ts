import { DEMO_VIDEO_TEMPLATES } from '../src/demo-video-templates';
import { InMemoryRenderJobQueue, RenderJobService } from '../src/render-jobs';
import { TemplateEngine, VideoTemplate } from '../src/template-engine';
import { VideoEngine, VERTICAL_VIDEO_OUTPUT } from '../src/video-engine';

describe('FASE 9 Template Engine, Video Engine, and Render Jobs', () => {
  const metadata = {
    source: 'Test library',
    author: 'Test author',
    license: 'CC0',
    license_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    commercial_use: true,
    attribution_required: false,
  };
  const audio = {
    id: 'narration',
    type: 'audio' as const,
    url: '/assets/narration.mp3',
    mimeType: 'audio/mpeg',
    durationMs: 30_000,
    metadata,
  };
  const template: VideoTemplate = {
    id: 'generic-short',
    name: 'Generic vertical short',
    contentTypes: ['any_content_type'],
    layers: [
      { id: 'background', type: 'background' },
      { id: 'image', type: 'image' },
      { id: 'video', type: 'video' },
      { id: 'audio', type: 'audio' },
      { id: 'music', type: 'music' },
      { id: 'subtitles', type: 'subtitles' },
      { id: 'logo', type: 'logo' },
      { id: 'title', type: 'text', contentField: 'title', x: 80, y: 200 },
    ],
    transitions: [{ type: 'fade', durationMs: 500 }],
  };

  function createRenderRequest() {
    return {
      id: 'render-1',
      content: {
        id: 'content-1',
        fields: { title: 'A generic title', hook: 'A generic hook' },
      },
      template,
      audio,
      media: {
        background: { id: 'background', type: 'image' as const, url: '/assets/background.jpg', mimeType: 'image/jpeg', metadata },
        images: [{ id: 'image-1', type: 'image' as const, url: '/assets/image.jpg', mimeType: 'image/jpeg', metadata }],
        videos: [{ id: 'video-1', type: 'video' as const, url: '/assets/video.mp4', mimeType: 'video/mp4', metadata }],
        music: { ...audio, id: 'music', url: '/assets/music.mp3' },
        logo: { id: 'logo', type: 'image' as const, url: '/assets/logo.png', mimeType: 'image/png', metadata },
      },
      subtitles: { format: 'SRT' as const, filePath: '/assets/subtitles.srt' },
      outputPath: '/output/render-1.mp4',
    };
  }

  test('stores Christian and Automotive demonstration templates as generic template data', () => {
    const templates = new TemplateEngine(DEMO_VIDEO_TEMPLATES);

    expect(templates.list('morning_prayer')[0].id).toBe('christian-prayer');
    expect(templates.list('daily_verse')[0].id).toBe('christian-verse');
    expect(templates.list('bible_reflection')[0].id).toBe('christian-reflection');
    expect(templates.list('car_tip')[0].id).toBe('automotive-car-tip');
    expect(templates.list('maintenance')[0].id).toBe('automotive-maintenance');
  });

  test('builds a domain-agnostic FFmpeg plan for background, media, audio, music, subtitles, logo, text, and transitions', () => {
    const plan = new VideoEngine().buildPlan(createRenderRequest());

    expect(plan.output).toEqual(VERTICAL_VIDEO_OUTPUT);
    expect(plan.inputs.map((input) => input.role)).toEqual(['background', 'image', 'video', 'audio', 'music', 'logo']);
    expect(plan.filterComplex).toContain('drawtext=text=\'A generic title\'');
    expect(plan.filterComplex).toContain("subtitles='/assets/subtitles.srt'");
    expect(plan.filterComplex).toContain('amix=inputs=2:duration=first');
    expect(plan.filterComplex).toContain('fade=t=in:st=0:d=0.5');
    expect(plan.args).toEqual(expect.arrayContaining(['-c:v', 'libx264', '-r', '30', '-c:a', 'aac', '/output/render-1.mp4']));
  });

  test('delegates actual execution to an FFmpeg executor', async () => {
    const result = { outputPath: '/output/render-1.mp4', output: VERTICAL_VIDEO_OUTPUT, durationMs: 30_000 };
    const executor = { execute: jest.fn().mockResolvedValue(result) };
    const rendered = await new VideoEngine().render(createRenderRequest(), executor);

    expect(rendered).toEqual(result);
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({ output: VERTICAL_VIDEO_OUTPUT }));
  });

  test('uses idempotency keys and retry policies for render jobs', async () => {
    const jobs = new RenderJobService(new InMemoryRenderJobQueue());
    const payload = {
      idempotencyKey: 'tenant-1:content-1:template-1',
      tenantId: 'tenant-1',
      render: createRenderRequest(),
    };

    const first = await jobs.enqueue(payload);
    const repeated = await jobs.enqueue(payload);

    expect(first.reused).toBe(false);
    expect(first.job.attempts).toBe(3);
    expect(repeated.reused).toBe(true);
    expect(repeated.job.id).toBe(first.job.id);
  });
});
