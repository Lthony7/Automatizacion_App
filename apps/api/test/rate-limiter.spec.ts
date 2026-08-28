/*
 * Rate Limiter Tests — FASE 9.6
 * Unit test for the in-memory sliding window rate limiter.
 */

describe('MemoryRateLimiter (inline)', () => {
  // Replicate the class from main.ts to test in isolation
  class MemoryRateLimiter {
    private hits = new Map<string, number[]>();
    constructor(
      private readonly maxHits: number,
      private readonly windowMs: number,
    ) {}

    check(key: string): { allowed: boolean; retryAfterSec: number } {
      const now = Date.now();
      const windowStart = now - this.windowMs;
      const timestamps = (this.hits.get(key) || []).filter((t) => t > windowStart);
      if (timestamps.length >= this.maxHits) {
        this.hits.set(key, timestamps);
        const retryAfterSec = Math.ceil((timestamps[0] + this.windowMs - now) / 1000);
        return { allowed: false, retryAfterSec };
      }
      timestamps.push(now);
      this.hits.set(key, timestamps);
      return { allowed: true, retryAfterSec: 0 };
    }
  }

  it('allows requests under the limit', () => {
    const limiter = new MemoryRateLimiter(3, 60_000);
    expect(limiter.check('ip:1').allowed).toBe(true);
    expect(limiter.check('ip:1').allowed).toBe(true);
    expect(limiter.check('ip:1').allowed).toBe(true);
  });

  it('rejects requests over the limit', () => {
    const limiter = new MemoryRateLimiter(2, 60_000);
    expect(limiter.check('ip:1').allowed).toBe(true);
    expect(limiter.check('ip:1').allowed).toBe(true);
    const third = limiter.check('ip:1');
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });

  it('tracks different keys independently', () => {
    const limiter = new MemoryRateLimiter(1, 60_000);
    expect(limiter.check('ip:1').allowed).toBe(true);
    expect(limiter.check('ip:1').allowed).toBe(false);
    expect(limiter.check('ip:2').allowed).toBe(true);
  });

  it('window slides (allows after expiry)', () => {
    const limiter = new MemoryRateLimiter(1, 1); // 1ms window
    expect(limiter.check('ip:1').allowed).toBe(true);
    expect(limiter.check('ip:1').allowed).toBe(false);
    // Wait for window to slide
    const start = Date.now();
    while (Date.now() - start < 2) {} // busy wait 2ms
    expect(limiter.check('ip:1').allowed).toBe(true);
  });
});
