import type { Publisher, PublicationRequest, PublicationResult, SocialAccount } from '../social-publisher';

const IG_API = 'https://graph.facebook.com/v19.0';

export class InstagramPublisher implements Publisher {
  readonly platform = 'instagram' as const;

  constructor(
    private readonly appId: string,
    private readonly appSecret: string,
  ) {}

  async publish(request: PublicationRequest, account: SocialAccount): Promise<PublicationResult> {
    const token = await this.ensureValidToken(account);

    // Step 1: Create media container
    const containerRes = await fetch(
      `${IG_API}/${account.accountId}/media`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({
          media_type: 'REELS',
          video_url: request.videoPath || '',
          caption: this.buildCaption(request),
          share_to_feed: 'true',
        }),
      },
    );

    const container = await containerRes.json() as { id?: string; error?: { message?: string } };
    if (!container.id) {
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'instagram',
        idempotencyKey: request.idempotencyKey,
        error: `Instagram container creation failed: ${container.error?.message || 'unknown'}`,
      };
    }

    // Step 2: Poll for processing (Instagram requires wait)
    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status === 'IN_PROGRESS' && attempts < 30) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(
        `${IG_API}/${container.id}?fields=status_code`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const statusData = await statusRes.json() as { status_code?: string };
      status = statusData.status_code || 'IN_PROGRESS';
      attempts++;
    }

    if (status !== 'FINISHED') {
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'instagram',
        idempotencyKey: request.idempotencyKey,
        error: `Instagram processing timeout: status=${status}`,
      };
    }

    // Step 3: Publish the container
    const publishRes = await fetch(
      `${IG_API}/${account.accountId}/media_publish`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({ creation_id: container.id }),
      },
    );

    const published = await publishRes.json() as { id?: string; error?: { message?: string } };
    if (!published.id) {
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'instagram',
        idempotencyKey: request.idempotencyKey,
        error: `Instagram publish failed: ${published.error?.message || 'unknown'}`,
      };
    }

    return {
      success: true,
      postId: published.id,
      postUrl: `https://www.instagram.com/reel/${published.id}`,
      publishedAt: new Date(),
      platform: 'instagram',
      idempotencyKey: request.idempotencyKey,
    };
  }

  async verifyAccount(account: SocialAccount): Promise<boolean> {
    try {
      const token = await this.ensureValidToken(account);
      const res = await fetch(`${IG_API}/${account.accountId}?fields=id,username`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      state,
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const res = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await res.json() as { access_token?: string; expires_in?: number; error?: { message?: string } };
    if (!data.access_token) throw new Error(`Instagram OAuth exchange failed: ${data.error?.message}`);
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async refreshToken(account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }> {
    // Instagram/Facebook long-lived tokens can be extended
    const res = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${account.accessToken}`,
    );
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error('Instagram token refresh failed');
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  private buildCaption(request: PublicationRequest): string {
    const parts: string[] = [];
    if (request.title) parts.push(request.title);
    if (request.description) parts.push(request.description);
    if (request.hashtags?.length) parts.push(request.hashtags.map((h) => h.startsWith('#') ? h : `#${h}`).join(' '));
    return parts.join('\n\n');
  }

  private async ensureValidToken(account: SocialAccount): Promise<string> {
    if (account.expiresAt && account.expiresAt > new Date()) {
      return account.accessToken;
    }
    if (account.refreshToken) {
      const refreshed = await this.refreshToken(account);
      return refreshed.accessToken;
    }
    return account.accessToken;
  }
}
