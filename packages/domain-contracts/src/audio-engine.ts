import type { MediaAsset } from './media-engine';

export interface AudioAsset extends MediaAsset {
  type: 'audio';
  durationMs: number;
}

export interface TTSRequest {
  text: string;
  voiceId?: string;
  languageCode: string;
  speakingRate?: number;
  pitch?: number;
  outputFormat?: 'mp3' | 'wav' | 'ogg';
}

export interface TTSVoice {
  id: string;
  name: string;
  languageCode: string;
  gender?: 'female' | 'male' | 'neutral';
}

export interface TTSProvider {
  getProviderName(): string;
  synthesize(request: TTSRequest): Promise<AudioAsset>;
  listVoices?(languageCode?: string): Promise<TTSVoice[]>;
}

/** Provider client adapters isolate vendor SDKs and credentials from Core. */
export interface TTSProviderClient {
  synthesize(request: TTSRequest): Promise<AudioAsset>;
  listVoices?(languageCode?: string): Promise<TTSVoice[]>;
}

class AdapterTTSProvider implements TTSProvider {
  constructor(
    private readonly providerName: string,
    private readonly client: TTSProviderClient,
  ) {}

  getProviderName(): string {
    return this.providerName;
  }

  synthesize(request: TTSRequest): Promise<AudioAsset> {
    if (!request.text.trim()) {
      throw new Error('TTS text is required.');
    }
    return this.client.synthesize(request);
  }

  async listVoices(languageCode?: string): Promise<TTSVoice[]> {
    return this.client.listVoices?.(languageCode) ?? [];
  }
}

export class GoogleTTSProvider extends AdapterTTSProvider {
  constructor(client: TTSProviderClient) {
    super('google', client);
  }
}

export class ElevenLabsTTSProvider extends AdapterTTSProvider {
  constructor(client: TTSProviderClient) {
    super('elevenlabs', client);
  }
}

export class LocalTTSProvider extends AdapterTTSProvider {
  constructor(client: TTSProviderClient) {
    super('local', client);
  }
}

/** Generic TTS dispatcher for every vertical. */
export class AudioEngine {
  private readonly providers = new Map<string, TTSProvider>();

  constructor(providers: TTSProvider[] = []) {
    providers.forEach((provider) => this.register(provider));
  }

  register(provider: TTSProvider): void {
    this.providers.set(provider.getProviderName(), provider);
  }

  async synthesize(providerName: string, request: TTSRequest): Promise<AudioAsset> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown TTS provider: ${providerName}`);
    }
    return provider.synthesize(request);
  }

  async listVoices(providerName: string, languageCode?: string): Promise<TTSVoice[]> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown TTS provider: ${providerName}`);
    }
    return provider.listVoices?.(languageCode) ?? [];
  }
}
