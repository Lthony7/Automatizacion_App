export type MediaType = 'image' | 'video' | 'audio';

export interface MediaMetadata {
  source: string;
  author: string;
  license: string;
  license_url: string;
  commercial_use: boolean;
  attribution_required: boolean;
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  mimeType: string;
  durationMs?: number;
  width?: number;
  height?: number;
  metadata: MediaMetadata;
}

export interface MediaSearchRequest {
  query: string;
  type?: MediaType;
  limit?: number;
  requireCommercialUse?: boolean;
}

export interface MediaProvider {
  getProviderName(): string;
  search(request: MediaSearchRequest): Promise<MediaAsset[]>;
  getById?(id: string): Promise<MediaAsset | undefined>;
}

export interface MediaLicenseValidation {
  valid: boolean;
  errors: string[];
  attribution: string[];
}

/** Generic licensed-media discovery. Verticals only consume MediaAsset. */
export class MediaEngine {
  private readonly providers = new Map<string, MediaProvider>();

  constructor(providers: MediaProvider[] = []) {
    providers.forEach((provider) => this.register(provider));
  }

  register(provider: MediaProvider): void {
    this.providers.set(provider.getProviderName(), provider);
  }

  async search(providerName: string, request: MediaSearchRequest): Promise<MediaAsset[]> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown media provider: ${providerName}`);
    }

    const assets = await provider.search(request);
    return request.requireCommercialUse ? assets.filter((asset) => asset.metadata.commercial_use) : assets;
  }

  validateLicense(asset: MediaAsset, requireCommercialUse = true): MediaLicenseValidation {
    const errors: string[] = [];
    const attribution: string[] = [];

    if (!asset.metadata.source) errors.push('Media source is required.');
    if (!asset.metadata.author) errors.push('Media author is required.');
    if (!asset.metadata.license) errors.push('Media license is required.');
    if (!asset.metadata.license_url) errors.push('Media license_url is required.');
    if (requireCommercialUse && !asset.metadata.commercial_use) {
      errors.push('Media is not licensed for commercial use.');
    }
    if (asset.metadata.attribution_required) {
      attribution.push(`${asset.metadata.author} - ${asset.metadata.source} (${asset.metadata.license})`);
    }

    return { valid: errors.length === 0, errors, attribution };
  }
}

export class InMemoryMediaProvider implements MediaProvider {
  constructor(
    private readonly providerName: string,
    private readonly assets: MediaAsset[],
  ) {}

  getProviderName(): string {
    return this.providerName;
  }

  async search(request: MediaSearchRequest): Promise<MediaAsset[]> {
    const query = request.query.toLowerCase();
    const matchingAssets = this.assets.filter((asset) =>
      (!request.type || asset.type === request.type) &&
      `${asset.id} ${asset.metadata.source} ${asset.metadata.author}`.toLowerCase().includes(query),
    );
    return matchingAssets.slice(0, request.limit ?? matchingAssets.length);
  }

  async getById(id: string): Promise<MediaAsset | undefined> {
    return this.assets.find((asset) => asset.id === id);
  }
}
