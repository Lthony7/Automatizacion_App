import { AudioEngine, ElevenLabsTTSProvider, GoogleTTSProvider, LocalTTSProvider } from '../src/audio-engine';
import { InMemoryMediaProvider, MediaEngine } from '../src/media-engine';
import { SubtitleEngine } from '../src/subtitle-engine';

describe('FASE 8 Media, Audio, and Subtitle Engines', () => {
  const licensedMetadata = {
    source: 'Example Media Library',
    author: 'Example Author',
    license: 'CC BY 4.0',
    license_url: 'https://creativecommons.org/licenses/by/4.0/',
    commercial_use: true,
    attribution_required: true,
  };
  const audio = {
    id: 'audio-1',
    type: 'audio' as const,
    url: 'https://storage.example/audio-1.mp3',
    mimeType: 'audio/mpeg',
    durationMs: 2_500,
    metadata: licensedMetadata,
  };

  test('discovers generic media and enforces commercial-license metadata', async () => {
    const provider = new InMemoryMediaProvider('library', [
      {
        id: 'commercial-video',
        type: 'video',
        url: 'https://media.example/commercial.mp4',
        mimeType: 'video/mp4',
        metadata: licensedMetadata,
      },
      {
        id: 'restricted-video',
        type: 'video',
        url: 'https://media.example/restricted.mp4',
        mimeType: 'video/mp4',
        metadata: { ...licensedMetadata, commercial_use: false },
      },
    ]);
    const media = new MediaEngine([provider]);

    const assets = await media.search('library', { query: 'video', type: 'video', requireCommercialUse: true });
    const validation = media.validateLicense(assets[0]);
    const restricted = await provider.getById('restricted-video');

    expect(assets.map((asset) => asset.id)).toEqual(['commercial-video']);
    expect(validation.valid).toBe(true);
    expect(validation.attribution).toContain('Example Author - Example Media Library (CC BY 4.0)');
    expect(media.validateLicense(restricted as any).valid).toBe(false);
  });

  test('dispatches synthesis through Google, ElevenLabs, and local adapters without vendor coupling', async () => {
    const googleClient = { synthesize: jest.fn().mockResolvedValue(audio) };
    const elevenLabsClient = { synthesize: jest.fn().mockResolvedValue(audio) };
    const localClient = { synthesize: jest.fn().mockResolvedValue(audio) };
    const providers = [
      new GoogleTTSProvider(googleClient),
      new ElevenLabsTTSProvider(elevenLabsClient),
      new LocalTTSProvider(localClient),
    ];
    const engine = new AudioEngine(providers);

    const output = await engine.synthesize('google', {
      text: 'A provider-neutral narration.',
      languageCode: 'en-US',
      outputFormat: 'mp3',
    });

    expect(output).toEqual(audio);
    expect(googleClient.synthesize).toHaveBeenCalledWith(expect.objectContaining({ languageCode: 'en-US' }));
    expect(providers.map((provider) => provider.getProviderName())).toEqual(['google', 'elevenlabs', 'local']);
  });

  test('renders timed and highlighted subtitles as SRT and ASS', async () => {
    const subtitleProvider = {
      getProviderName: () => 'transcriber',
      generateCues: jest.fn().mockResolvedValue([
        { startMs: 0, endMs: 1_250, text: 'Hello world', highlightedWords: ['world'] },
        { startMs: 1_500, endMs: 2_500, text: 'Provider neutral subtitles' },
      ]),
    };
    const engine = new SubtitleEngine([subtitleProvider]);
    const style = {
      font: 'Montserrat',
      size: 42,
      position: 'center' as const,
      highlighting: { enabled: true, color: '#FFFF00' },
    };

    const srt = await engine.generate('transcriber', { audio, languageCode: 'en-US' }, 'SRT', style);
    const ass = engine.render(srt.cues, 'ASS', style);

    expect(srt.content).toContain('00:00:00,000 --> 00:00:01,250');
    expect(srt.content).toContain('Hello <b>world</b>');
    expect(ass.content).toContain('Style: Default,Montserrat,42');
    expect(ass.content).toContain(',5,20,20,20,1');
    expect(ass.content).toContain('0:00:00.00');
    expect(ass.content).toContain('{\\c&H00FFFF&}world');
  });
});
