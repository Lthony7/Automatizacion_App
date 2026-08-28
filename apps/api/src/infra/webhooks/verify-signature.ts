/*
 * Webhook Signature Verification - FASE 9.6 (FASE 9)
 *
 * HMAC-SHA256 verification with timing-safe comparison for social platform
 * webhooks (Facebook/Instagram `X-Hub-Signature-256`, generic providers).
 * Never trust the raw payload without a verified signature.
*/

import { createHmac, timingSafeEqual } from 'crypto';

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
}

/** Constant-time comparison of two hex digests or raw buffers. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Still perform a comparison to keep timing uniform
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify an HMAC-SHA256 signed webhook.
 *
 * @param rawBody - the EXACT raw request body bytes as received (not re-serialized)
 * @param signatureHeader - value of `X-Hub-Signature-256` (`sha256=<hex>`) or bare hex
 * @param secret - webhook signing secret (per-provider, from env/secrets manager)
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  secret: string,
): WebhookVerificationResult {
  if (!signatureHeader) {
    return { valid: false, reason: 'missing signature header' };
  }
  if (!secret) {
    return { valid: false, reason: 'webhook secret not configured' };
  }

  const provided = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length).trim().toLowerCase()
    : signatureHeader.trim().toLowerCase();

  const expected = createHmac('sha256', secret)
    .update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody)
    .digest('hex');

  return { valid: safeEqual(provided, expected), reason: provided ? undefined : 'empty signature' };
}
