import type { AudioAsset } from './audio-engine';

export type SubtitleFormat = 'SRT' | 'ASS';
export type SubtitlePosition = 'top' | 'center' | 'bottom';

export interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
  highlightedWords?: string[];
}

export interface SubtitleStyle {
  font: string;
  size: number;
  position: SubtitlePosition;
  highlighting?: {
    enabled: boolean;
    color?: string;
  };
}

export interface SubtitleGenerationRequest {
  audio: AudioAsset;
  languageCode: string;
}

export interface SubtitleProvider {
  getProviderName(): string;
  generateCues(request: SubtitleGenerationRequest): Promise<SubtitleCue[]>;
}

export interface RenderedSubtitles {
  format: SubtitleFormat;
  content: string;
  cues: SubtitleCue[];
  style: SubtitleStyle;
}

/** Generic transcription and subtitle rendering service. */
export class SubtitleEngine {
  private readonly providers = new Map<string, SubtitleProvider>();

  constructor(providers: SubtitleProvider[] = []) {
    providers.forEach((provider) => this.register(provider));
  }

  register(provider: SubtitleProvider): void {
    this.providers.set(provider.getProviderName(), provider);
  }

  async generate(
    providerName: string,
    request: SubtitleGenerationRequest,
    format: SubtitleFormat,
    style: SubtitleStyle,
  ): Promise<RenderedSubtitles> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown subtitle provider: ${providerName}`);
    }
    const cues = await provider.generateCues(request);
    return this.render(cues, format, style);
  }

  render(cues: SubtitleCue[], format: SubtitleFormat, style: SubtitleStyle): RenderedSubtitles {
    this.validate(cues, style);
    return {
      format,
      content: format === 'SRT' ? this.renderSrt(cues, style) : this.renderAss(cues, style),
      cues,
      style,
    };
  }

  private validate(cues: SubtitleCue[], style: SubtitleStyle): void {
    if (!style.font.trim() || !Number.isFinite(style.size) || style.size <= 0) {
      throw new Error('Subtitle font and a positive size are required.');
    }
    for (const cue of cues) {
      if (cue.startMs < 0 || cue.endMs <= cue.startMs || !cue.text.trim()) {
        throw new Error('Each subtitle cue requires valid timing and text.');
      }
    }
  }

  private renderSrt(cues: SubtitleCue[], style: SubtitleStyle): string {
    return cues.map((cue, index) => [
      String(index + 1),
      `${this.formatSrtTime(cue.startMs)} --> ${this.formatSrtTime(cue.endMs)}`,
      this.highlightSrt(cue, style),
    ].join('\n')).join('\n\n');
  }

  private renderAss(cues: SubtitleCue[], style: SubtitleStyle): string {
    const alignment = style.position === 'top' ? 8 : style.position === 'center' ? 5 : 2;
    const header = [
      '[Script Info]',
      'ScriptType: v4.00+',
      '',
      '[V4+ Styles]',
      'Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding',
      `Style: Default,${style.font},${style.size},&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,${alignment},20,20,20,1`,
      '',
      '[Events]',
      'Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text',
    ];
    const lines = cues.map((cue) =>
      `Dialogue: 0,${this.formatAssTime(cue.startMs)},${this.formatAssTime(cue.endMs)},Default,,0,0,0,,${this.highlightAss(cue, style)}`,
    );
    return [...header, ...lines].join('\n');
  }

  private highlightSrt(cue: SubtitleCue, style: SubtitleStyle): string {
    if (!style.highlighting?.enabled) return cue.text;
    return this.replaceHighlightedWords(cue.text, cue.highlightedWords, (word) => `<b>${word}</b>`);
  }

  private highlightAss(cue: SubtitleCue, style: SubtitleStyle): string {
    const text = cue.text.replace(/([{}])/g, '\\$1');
    if (!style.highlighting?.enabled) return text;
    const color = (style.highlighting.color ?? '#FFFF00').replace('#', '');
    return this.replaceHighlightedWords(text, cue.highlightedWords, (word) => `{\\c&H${this.toAssColor(color)}&}${word}{\\c&HFFFFFF&}`);
  }

  private replaceHighlightedWords(text: string, words: string[] | undefined, formatter: (word: string) => string): string {
    return (words ?? []).reduce(
      (result, word) => result.replace(new RegExp(`\\b${this.escapeRegExp(word)}\\b`, 'gi'), (match) => formatter(match)),
      text,
    );
  }

  private formatSrtTime(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3_600_000);
    const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
    const seconds = Math.floor((milliseconds % 60_000) / 1_000);
    const remainder = milliseconds % 1_000;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)},${String(remainder).padStart(3, '0')}`;
  }

  private formatAssTime(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3_600_000);
    const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
    const seconds = Math.floor((milliseconds % 60_000) / 1_000);
    const centiseconds = Math.floor((milliseconds % 1_000) / 10);
    return `${hours}:${this.pad(minutes)}:${this.pad(seconds)}.${this.pad(centiseconds)}`;
  }

  private toAssColor(rgb: string): string {
    return `${rgb.slice(4, 6)}${rgb.slice(2, 4)}${rgb.slice(0, 2)}`.toUpperCase();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
