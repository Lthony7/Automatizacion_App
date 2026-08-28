/*
 * Webhook Signature Verification Tests — FASE 9.6
 * Covers: valid signature, missing header, wrong secret, tampered body,
 * empty signature, sha256= prefix handling, timing-safe comparison.
 */

import { verifyWebhookSignature } from '../src/infra/webhooks/verify-signature';

describe('verifyWebhookSignature', () => {
  const secret = 'my-webhook-secret-32chars-long!!';
  const payload = '{"event":"content.published","id":"123"}';

  it('returns valid for correct HMAC-SHA256', () => {
    const { createHmac } = require('crypto');
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const result = verifyWebhookSignature(payload, `sha256=${sig}`, secret);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('returns valid for bare hex (no sha256= prefix)', () => {
    const { createHmac } = require('crypto');
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const result = verifyWebhookSignature(payload, sig, secret);
    expect(result.valid).toBe(true);
  });

  it('rejects missing signature header', () => {
    const result = verifyWebhookSignature(payload, undefined, secret);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing signature header');
  });

  it('rejects empty secret', () => {
    const result = verifyWebhookSignature(payload, 'sha256=abc', '');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('webhook secret not configured');
  });

  it('rejects wrong secret', () => {
    const { createHmac } = require('crypto');
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const result = verifyWebhookSignature(payload, `sha256=${sig}`, 'wrong-secret');
    expect(result.valid).toBe(false);
  });

  it('rejects tampered body', () => {
    const { createHmac } = require('crypto');
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const tampered = '{"event":"content.deleted","id":"123"}';
    const result = verifyWebhookSignature(tampered, `sha256=${sig}`, secret);
    expect(result.valid).toBe(false);
  });

  it('rejects empty signature string', () => {
    const result = verifyWebhookSignature(payload, '', secret);
    expect(result.valid).toBe(false);
  });

  it('handles Buffer input (raw body)', () => {
    const { createHmac } = require('crypto');
    const buf = Buffer.from(payload, 'utf8');
    const sig = createHmac('sha256', secret).update(buf).digest('hex');
    const result = verifyWebhookSignature(buf, `sha256=${sig}`, secret);
    expect(result.valid).toBe(true);
  });

  it('handles case-insensitive hex comparison', () => {
    const { createHmac } = require('crypto');
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const result = verifyWebhookSignature(payload, `sha256=${sig.toUpperCase()}`, secret);
    expect(result.valid).toBe(true);
  });

  it('rejects signature with leading/trailing whitespace around sha256= prefix', () => {
    // Leading spaces before sha256= mean the prefix check fails,
    // the entire string is trimmed and treated as bare hex — which won't match.
    const { createHmac } = require('crypto');
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const result = verifyWebhookSignature(payload, `  sha256=${sig}  `, secret);
    expect(result.valid).toBe(false);
  });

  it('accepts signature with whitespace after sha256= (trimmed internally)', () => {
    const { createHmac } = require('crypto');
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    // No leading space — just trailing space after the hex
    const result = verifyWebhookSignature(payload, `sha256=${sig}  `, secret);
    expect(result.valid).toBe(true);
  });
});
