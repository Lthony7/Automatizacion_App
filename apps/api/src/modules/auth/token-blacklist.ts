/*
 * Token Blacklist - FASE 9.6 (H-01)
 * JWT logout support: revoked tokens are stored with a TTL equal to the token's
 * remaining lifetime. Encapsulated behind TokenBlacklistStore so production can
 * swap the in-memory implementation for Redis without touching callers:
 *
 *   class RedisTokenBlacklist implements TokenBlacklistStore { ... }
 *
 * The default store is per-process and MUST be replaced by the Redis adapter
 * when running multiple API instances (documented in docs/SECURITY.md).
*/

export interface TokenBlacklistStore {
  revoke(jti: string, ttlSeconds: number): Promise<void>;
  isRevoked(jti: string): Promise<boolean>;
}

/** Cleanup interval to purge expired entries (ms). */
const SWEEP_INTERVAL_MS = 60_000;

export class InMemoryTokenBlacklist implements TokenBlacklistStore {
  private readonly entries = new Map<string, number>(); // jti -> expiresAt epoch ms
  private sweeper?: ReturnType<typeof setInterval>;

  async revoke(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return; // already expired naturally
    this.entries.set(jti, Date.now() + ttlSeconds * 1000);
    if (!this.sweeper) {
      this.sweeper = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
      // Never keep the process alive just for sweeping
      (this.sweeper as any).unref?.();
    }
  }

  async isRevoked(jti: string): Promise<boolean> {
    const expiresAt = this.entries.get(jti);
    if (expiresAt === undefined) return false;
    if (Date.now() > expiresAt) {
      this.entries.delete(jti);
      return false;
    }
    return true;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [jti, exp] of this.entries) {
      if (now > exp) this.entries.delete(jti);
    }
  }
}

/** Process-wide singleton; injectable replacement for tests. */
let globalStore: TokenBlacklistStore | undefined;

export function getTokenBlacklist(): TokenBlacklistStore {
  if (!globalStore) globalStore = new InMemoryTokenBlacklist();
  return globalStore;
}

export function setTokenBlacklist(store: TokenBlacklistStore): void {
  globalStore = store;
}
