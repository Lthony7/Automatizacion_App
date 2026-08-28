/*
 * Auth Utilities - Content Automation Platform FASE 2
 * JWT token generation, password verification, token refresh
*/

import { sign, verify } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

export interface TokenPayload {
  sub: string;        // userId
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate JWT access and refresh tokens
*/
export function generateTokens(userId: string, tenantId: string, role: string): TokenPair {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtSecret || jwtSecret.includes('change-this') || jwtSecret.length < 32) throw new Error('JWT_SECRET misconfigured');
  if (!refreshSecret || refreshSecret.includes('change-this') || refreshSecret.length < 32) throw new Error('JWT_REFRESH_SECRET misconfigured');
  const accessToken = sign(
    { sub: userId, tenantId, role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m', issuer: 'content-automation', audience: 'api', algorithm: 'HS256' } as any,
  );

  const refreshToken = sign(
    { sub: userId, tenantId, role },
    refreshSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', issuer: 'content-automation', audience: 'api', algorithm: 'HS256' } as any,
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Verify password against hash
*/
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Verify JWT token and return payload
*/
export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.includes('change-this')) return null;
    return verify(token, secret, { algorithms: ['HS256'], issuer: 'content-automation', audience: 'api' }) as unknown as TokenPayload;
  } catch {
    return null;
  }
}