export type VideoLayerType = 'background' | 'image' | 'video' | 'audio' | 'music' | 'subtitles' | 'logo' | 'text';

export interface TemplateTransition {
  type: 'fade' | 'dissolve' | 'slide';
  durationMs: number;
}

export interface VideoTemplateLayer {
  id: string;
  type: VideoLayerType;
  contentField?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  startMs?: number;
  endMs?: number;
}

export interface VideoTemplate {
  id: string;
  name: string;
  contentTypes: string[];
  layers: VideoTemplateLayer[];
  transitions?: TemplateTransition[];
  metadata?: Record<string, unknown>;
}

export class TemplateEngine {
  private readonly templates = new Map<string, VideoTemplate>();

  constructor(templates: VideoTemplate[] = []) {
    templates.forEach((template) => this.register(template));
  }

  register(template: VideoTemplate): void {
    this.validate(template);
    this.templates.set(template.id, template);
  }

  get(templateId: string): VideoTemplate | undefined {
    return this.templates.get(templateId);
  }

  list(contentType?: string): VideoTemplate[] {
    return [...this.templates.values()].filter((template) =>
      !contentType || template.contentTypes.includes(contentType),
    );
  }

  validate(template: VideoTemplate): void {
    if (!template.id || !template.name || template.contentTypes.length === 0 || template.layers.length === 0) {
      throw new Error('A video template requires id, name, content types, and layers.');
    }
    const layerIds = new Set<string>();
    for (const layer of template.layers) {
      if (!layer.id || layerIds.has(layer.id)) {
        throw new Error(`Video template has an invalid or duplicate layer id: ${layer.id}`);
      }
      if (layer.type === 'text' && !layer.contentField) {
        throw new Error(`Text layer "${layer.id}" requires a content field.`);
      }
      if (layer.endMs !== undefined && layer.startMs !== undefined && layer.endMs <= layer.startMs) {
        throw new Error(`Layer "${layer.id}" has invalid timing.`);
      }
      layerIds.add(layer.id);
    }
    for (const transition of template.transitions ?? []) {
      if (transition.durationMs <= 0) {
        throw new Error('Template transition duration must be positive.');
      }
    }
  }
}
