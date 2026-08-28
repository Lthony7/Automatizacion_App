import type { Publisher, PublicationRequest, PublicationResult, SocialAccount } from '../social-publisher';

const FB_API = 'https://graph.facebook.com/v19.0';

export class FacebookPublisher implements Publisher {
  readonly platform = 'facebook' as const;

  constructor(
    private readonly appId: string,
    private readonly appSecret: string,
  ) {}

  async publish(request: PublicationRequest, account: SocialAccount): Promise<PublicationResult> {
    const token = await this.ensureValidToken(account);

    // Step 1: Initiate video upload
    const initRes = await fetch(
      `${FB_API}/${account.accountId}/videos`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({
          upload_phase: 'start',
          file_size: '0', // Would be actual file size
        }),
      },
    );

    const init = await initRes.json() as { video_id?: string; upload_url?: string; error?: { message?: string } };
    if (!init.video_id) {
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'facebook',
        idempotencyKey: request.idempotencyKey,
        error: `Facebook upload init failed: ${init.error?.message || 'unknown'}`,
      };
    }

    // Step 2: Upload video file
    const uploadRes = await fetch(
      `${FB_API}/${init.video_id}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({
          upload_phase: 'transfer',
          video_file_chunk: request.videoPath || '',
        }),
      },
    );

    const uploadData = await uploadRes.json() as { success?: boolean; error?: { message?: string } };
    if (!uploadData.success) {
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'facebook',
        idempotencyKey: request.idempotencyKey,
        error: `Facebook upload transfer failed: ${uploadData.error?.message || 'unknown'}`,
      };
    }

    // Step 3: Publish with description and title
    const publishRes = await fetch(
      `${FB_API}/${init.video_id}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({
          upload_phase: 'finish',
          title: request.title,
          description: this.buildDescription(request),
          published: request.scheduledAt ? 'false' : 'true',
          ...(request.scheduledAt
            ? { scheduled_publish_time: Math.floor(request.scheduledAt.getTime() / 1000).toString() }
            : {}),
        }),
      },
    );

    const publish = await publishRes.json() as { id?: string; success?: boolean; error?: { message?: string } };
    if (publish.error) {
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'facebook',
        idempotencyKey: request.idempotencyKey,
        error: `Facebook publish failed: ${publish.error.message}`,
      };
    }

    return {
      success: true,
      postId: init.video_id,
      postUrl: `https://facebook.com/watch?v=${init.video_id}`,
      publishedAt: new Date(),
      platform: 'facebook',
      idempotencyKey: request.idempotencyKey,
    };
  }

  async verifyAccount(account: SocialAccount): Promise<boolean> {
    try {
      const token = await this.ensureValidToken(account);
      const res = await fetch(`${FB_API}/${account.accountId}?fields=id,name`, {
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
      scope: 'pages_manage_posts,pages_read_engagement,publish_video',
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
    if (!data.access_token) throw new Error(`Facebook OAuth exchange failed: ${data.error?.message}`);
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async refreshToken(account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }> {
    // NOTE: Facebook's fb_exchange_token endpoint only accepts query parameters
    // (no header/body alternative exists). This call is server-to-server over
    // HTTPS and the response is never logged; acceptable residual exposure.
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: account.accessToken,
    });
    const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params}`);
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error('Facebook token refresh failed');
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  private buildDescription(request: PublicationRequest): string {
    const parts: string[] = [];
    if (request.description) parts.push(request.description);
    if (request.hashtags?.length) parts.push(request.hashtags.join(' '));
    return parts.join('\n');
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
