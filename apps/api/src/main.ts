/*
 * Bootstrap - Content Automation Platform
 *
 * FASE 9.6 hardening:
 *  - Fails fast on missing/placeholder secrets (no secret values in output).
 *  - Explicit CORS allowlist via CORS_ORIGINS (comma-separated); no wildcard
 *    with credentials in production.
 *  - Global ValidationPipe with whitelist + forbidNonWhitelisted + transform.
 *  - Request ID middleware: validates X-Request-ID or generates one; echoes it.
 *  - Helmet for HTTP security headers (CSP, X-Frame-Options, etc.).
 *  - Per-endpoint rate limiting: 10 req / 60s / IP for auth, 100 / 60s for API.
 *  - CSRF note: auth uses Authorization Bearer headers (no auth cookies), so
 *    classic cookie-CSRF does not apply. See docs/SECURITY.md.
 */

import 'reflect-metadata';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { requestIdMiddleware } from './infra/logging/custom.logger';
import { seedBuiltinVerticals } from 'domain-contracts';

/** Required environment variables — boot fails with a clear message if missing. */
const REQUIRED_SECRETS = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

function validateSecrets(): void {
  const problems: string[] = [];
  for (const key of REQUIRED_SECRETS) {
    const value = process.env[key];
    if (!value || value.length < 32) {
      problems.push(`${key} must be set with at least 32 characters`);
    } else if (value.includes('change-this')) {
      problems.push(`${key} still contains the placeholder value`);
    }
  }
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    problems.push('DATABASE_URL must be set in production');
  }
  if (problems.length > 0) {
    console.error('FATAL: invalid security configuration:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
}

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS || 'http://localhost:3000';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Sliding window rate limiter — per-IP, per-key, or per-endpoint. */
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

const AUTH_RATE_LIMIT = 10;
const API_RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function rateLimitMiddleware(authLimiter: MemoryRateLimiter, apiLimiter: MemoryRateLimiter) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';

    // Auth endpoints: strict limit
    const isAuthEndpoint =
      req.method === 'POST' && (req.path === '/auth/login' || req.path === '/auth/register');
    if (isAuthEndpoint) {
      const result = authLimiter.check(`auth:${ip}`);
      if (!result.allowed) {
        res.setHeader('Retry-After', String(result.retryAfterSec));
        res.setHeader('X-RateLimit-Limit', String(AUTH_RATE_LIMIT));
        res.setHeader('X-RateLimit-Remaining', '0');
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Demasiadas solicitudes de autenticación. Inténtalo más tarde.',
        });
        return;
      }
      return next();
    }

    // All other endpoints: standard API limit
    const result = apiLimiter.check(`api:${ip}`);
    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(API_RATE_LIMIT));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Demasiadas solicitudes. Inténtalo más tarde.',
      });
      return;
    }
    next();
  };
}

async function bootstrap() {
  validateSecrets();

  // Seed built-in vertical metadata at boot
  seedBuiltinVerticals();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Helmet — HTTP security headers (CSP, X-Frame-Options, HSTS, etc.)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // allow cross-origin assets for PWA
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // Security headers basics
  app.disable('x-powered-by');

  // CORS — explicit allowlist, credentials enabled only for trusted origins
  app.enableCors({
    origin: parseCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
  });

  // Request ID propagation (FASE 20)
  app.use(requestIdMiddleware);

  // Rate limiting: separate limiters for auth (strict) and API (standard)
  app.use(rateLimitMiddleware(
    new MemoryRateLimiter(AUTH_RATE_LIMIT, RATE_WINDOW_MS),
    new MemoryRateLimiter(API_RATE_LIMIT, RATE_WINDOW_MS),
  ));

  // Global input validation (FASE 7)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.PORT || 4000);
  console.log(`API running on port ${process.env.PORT || 4000}`);
}

void bootstrap();
