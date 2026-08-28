import type { Publisher, PublicationRequest, PublicationResult, SocialAccount, SocialPlatform } from '../social-publisher';

/** Mock publisher for testing. Does NOT call any real API. */
export class MockPublisher implements Publisher {
  readonly platform: SocialPlatform;
  private publishLog: Array<{ request: PublicationRequest; account: SocialAccount }> = [];
  private shouldFail = false;

  constructor(platform: SocialPlatform) {
    this.platform = platform;
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  getPublishLog() {
    return [...this.publishLog];
  }

  clearLog() {
    this.publishLog = [];
  }

  async publish(request: PublicationRequest, account: SocialAccount): Promise<PublicationResult> {
    this.publishLog.push({ request, account });

    if (this.shouldFail) {
      return {
        success: false,
        publishedAt: new Date(),
        platform: this.platform,
        idempotencyKey: request.idempotencyKey,
        error: `Mock ${this.platform} publish failure`,
      };
    }

    const postId = `mock-${this.platform}-${Date.now()}`;
    return {
      success: true,
      postId,
      postUrl: `https://${this.platform}.com/mock/${postId}`,
      publishedAt: new Date(),
      platform: this.platform,
      idempotencyKey: request.idempotencyKey,
    };
  }

  async verifyAccount(_account: SocialAccount): Promise<boolean> {
    return !this.shouldFail;
  }

  getAuthUrl(redirectUri: string, state: string): string {
    return `https://mock-${this.platform}.com/auth?redirect=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  async exchangeCode(_code: string, _redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    if (this.shouldFail) throw new Error(`Mock ${this.platform} OAuth failed`);
    return {
      accessToken: `mock-token-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000),
    };
  }

  async refreshToken(_account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }> {
    if (this.shouldFail) throw new Error(`Mock ${this.platform} token refresh failed`);
    return {
      accessToken: `mock-refreshed-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000),
    };
  }
}

/** Creates a mock token store for testing. Tokens are stored in memory. */
export function createMockTokenStore() {
  const store = new Map<string, { accessToken: string; refreshToken?: string; expiresAt?: Date }>();
  return {
    async save(accountId: string, accessToken: string, refreshToken?: string, expiresAt?: Date) {
      store.set(accountId, { accessToken, refreshToken, expiresAt });
    },
    async load(accountId: string) {
      return store.get(accountId) ?? null;
    },
    async revoke(accountId: string) {
      store.delete(accountId);
    },
  };
}
