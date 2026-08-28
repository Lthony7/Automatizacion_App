/** Social publisher interface. Each platform implements this. */
export type SocialPlatform = 'youtube' | 'instagram' | 'facebook';

export type PublicationStatus =
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED';

export interface SocialAccount {
  id: string;
  tenantId: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicationRequest {
  idempotencyKey: string;
  contentId: string;
  tenantId: string;
  platform: SocialPlatform;
  accountId: string;
  title: string;
  description?: string;
  videoPath?: string;
  imageUrl?: string;
  hashtags?: string[];
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface PublicationResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  publishedAt: Date;
  platform: SocialPlatform;
  idempotencyKey: string;
  error?: string;
}

export interface Publisher {
  readonly platform: SocialPlatform;

  /** Publish content to the platform. Idempotent: same key returns same result. */
  publish(request: PublicationRequest, account: SocialAccount): Promise<PublicationResult>;

  /** Verify the account has valid credentials. */
  verifyAccount(account: SocialAccount): Promise<boolean>;

  /** Get the OAuth authorization URL for account linking. */
  getAuthUrl(redirectUri: string, state: string): string;

  /** Exchange authorization code for tokens. */
  exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;

  /** Refresh an expired access token. */
  refreshToken(account: SocialAccount): Promise<{ accessToken: string; expiresAt?: Date }>;
}

/** Token storage: encrypts tokens before persisting. Tokens are NEVER exposed in logs or responses. */
export interface TokenStore {
  save(accountId: string, accessToken: string, refreshToken?: string, expiresAt?: Date): Promise<void>;
  load(accountId: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date } | null>;
  revoke(accountId: string): Promise<void>;
}
