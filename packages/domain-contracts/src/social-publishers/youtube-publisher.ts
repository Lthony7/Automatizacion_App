import type { Publisher, PublicationRequest, PublicationResult, SocialAccount } from '../social-publisher';

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

export class YouTubePublisher implements Publisher {
  readonly platform = 'youtube' as const;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  async publish(request: PublicationRequest, account: SocialAccount): Promise<PublicationResult> {
    const token = await this.ensureValidToken(account);

    // Step 1: Resumable upload initiation
    const initRes = await fetch(
      `${YOUTUBE_API}/videos?part=snippet,status`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify({
          snippet: {
            title: request.title,
            description: request.description || '',
            tags: request.hashtags || [],
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus: request.scheduledAt ? 'private' : 'public',
            selfDeclaredMadeForKids: false,
          },
        }),
      },
    );

    if (!initRes.ok) {
      const err = await initRes.text();
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'youtube',
        idempotencyKey: request.idempotencyKey,
        error: `YouTube upload init failed: ${initRes.status} ${err}`,
      };
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) {
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'youtube',
        idempotencyKey: request.idempotencyKey,
        error: 'YouTube did not return upload URL',
      };
    }

    // Step 2: Upload video bytes
    const videoRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'video/mp4',
      },
      body: request.videoPath, // In real impl, read file stream
    });

    if (!videoRes.ok) {
      const err = await videoRes.text();
      return {
        success: false,
        publishedAt: new Date(),
        platform: 'youtube',
        idempotencyKey: request.idempotencyKey,
        error: `YouTube video upload failed: ${videoRes.status} ${err}`,
      };
    }

    const videoData = await videoRes.json() as { id?: string };
    return {
      success: true,
      postId: videoData.id,
      postUrl: `https://youtube.com/watch?v=${videoData.id}`,
      publishedAt: new Date(),
      platform: 'youtube',
      idempotencyKey: request.idempotencyKey,
    };
  }

  async verifyAccount(account: SocialAccount): Promise<boolean> {
    try {
      const token = await this.ensureValidToken(account);
      const res = await fetch(`${YOUTUBE_API}/channels?part=id&mine=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await res.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) throw new Error('YouTube OAuth exchange failed');
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async refreshToken(account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }> {
    if (!account.refreshToken) throw new Error('No refresh token available');
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: account.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new Error('YouTube token refresh failed');
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
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
