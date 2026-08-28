/*
 * Auth Utils Tests — FASE 9.6
 * Covers: generateTokens, verifyPassword, verifyToken, env validation.
 */

import { generateTokens, verifyPassword, verifyToken } from '../src/modules/auth/auth.utils';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long-ok!';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-ok!';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('generateTokens', () => {
  it('returns accessToken and refreshToken as strings', () => {
    const tokens = generateTokens('user-1', 'tenant-1', 'ADMIN');
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
    expect(tokens.expiresIn).toBe(15 * 60);
  });

  it('throws if JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => generateTokens('u', 't', 'VIEWER')).toThrow('JWT_SECRET misconfigured');
  });

  it('throws if JWT_SECRET is too short', () => {
    process.env.JWT_SECRET = 'short';
    expect(() => generateTokens('u', 't', 'VIEWER')).toThrow('JWT_SECRET misconfigured');
  });

  it('throws if JWT_SECRET contains placeholder', () => {
    process.env.JWT_SECRET = 'change-this-is-the-default-value-ok!';
    expect(() => generateTokens('u', 't', 'VIEWER')).toThrow('JWT_SECRET misconfigured');
  });

  it('throws if JWT_REFRESH_SECRET is missing', () => {
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => generateTokens('u', 't', 'VIEWER')).toThrow('JWT_REFRESH_SECRET misconfigured');
  });

  it('tokens contain correct claims', () => {
    const tokens = generateTokens('user-42', 'tenant-99', 'OWNER');
    const decoded = verifyToken(tokens.accessToken);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('user-42');
    expect(decoded!.tenantId).toBe('tenant-99');
    expect(decoded!.role).toBe('OWNER');
  });
});

describe('verifyPassword', () => {
  it('returns true for matching password', async () => {
    const hash = await require('bcrypt').hash('myPassword123', 10);
    expect(await verifyPassword('myPassword123', hash)).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await require('bcrypt').hash('myPassword123', 10);
    expect(await verifyPassword('wrongPassword', hash)).toBe(false);
  });
});

describe('verifyToken', () => {
  it('returns decoded payload for valid token', () => {
    const tokens = generateTokens('user-1', 'tenant-1', 'VIEWER');
    const payload = verifyToken(tokens.accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-1');
    expect(payload!.role).toBe('VIEWER');
  });

  it('returns null for invalid token', () => {
    expect(verifyToken('garbage-token')).toBeNull();
  });

  it('returns null if JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;
    expect(verifyToken('any-token')).toBeNull();
  });

  it('returns null for expired token (simulated)', () => {
    const { sign } = require('jsonwebtoken');
    const expired = sign(
      { sub: 'u', tenantId: 't', role: 'V' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s', issuer: 'content-automation', audience: 'api', algorithm: 'HS256' },
    );
    expect(verifyToken(expired)).toBeNull();
  });
});
