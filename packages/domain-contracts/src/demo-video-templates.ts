import type { VideoTemplate } from './template-engine';

const commonLayers = [
  { id: 'background', type: 'background' as const },
  { id: 'image', type: 'image' as const },
  { id: 'video', type: 'video' as const },
  { id: 'audio', type: 'audio' as const },
  { id: 'music', type: 'music' as const },
  { id: 'logo', type: 'logo' as const },
  { id: 'subtitles', type: 'subtitles' as const },
  { id: 'title', type: 'text' as const, contentField: 'title', x: 60, y: 180 },
  { id: 'hook', type: 'text' as const, contentField: 'hook', x: 60, y: 340 },
];

function template(id: string, name: string, contentType: string, vertical: string): VideoTemplate {
  return {
    id,
    name,
    contentTypes: [contentType],
    layers: commonLayers.map((layer) => ({ ...layer })),
    transitions: [{ type: 'fade', durationMs: 500 }],
    metadata: { vertical },
  };
}

// These are data-only demonstration templates. VideoEngine does not inspect vertical metadata.
export const CHRISTIAN_DEMO_VIDEO_TEMPLATES: VideoTemplate[] = [
  template('christian-prayer', 'Christian Prayer', 'morning_prayer', 'christian'),
  template('christian-verse', 'Christian Verse', 'daily_verse', 'christian'),
  template('christian-reflection', 'Christian Reflection', 'bible_reflection', 'christian'),
];

export const AUTOMOTIVE_DEMO_VIDEO_TEMPLATES: VideoTemplate[] = [
  template('automotive-car-tip', 'Automotive Car Tip', 'car_tip', 'automotive'),
  template('automotive-maintenance', 'Automotive Maintenance', 'maintenance', 'automotive'),
];

export const DEMO_VIDEO_TEMPLATES: VideoTemplate[] = [
  ...CHRISTIAN_DEMO_VIDEO_TEMPLATES,
  ...AUTOMOTIVE_DEMO_VIDEO_TEMPLATES,
];
