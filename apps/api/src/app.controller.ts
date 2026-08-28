/*
 * App Controller - Content Automation Platform API
 * Health (liveness) and readiness endpoints.
 *
 * FASE 18: /ready now verifies Database and Redis connectivity.
 * No secret values or environment details are exposed in production responses.
*/

import { Controller, Get, HttpCode, HttpStatus, Header, Res } from '@nestjs/common';
import { AppService } from './app.service';

const CHECK_TIMEOUT_MS = 3_000;
async function withTimeout<T>(p: Promise<T>, ms = CHECK_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function checkDatabase(): Promise<'up' | 'down'> {
  try {
    // Lazy import so unit tests don't require a live pg driver
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await withTimeout(client.connect());
    await client.end();
    return 'up';
  } catch {
    return 'down';
  }
}

async function checkRedis(): Promise<'up' | 'down'> {
  try {
    const { createClient } = await import('redis');
    const url = process.env.REDIS_URL;
    if (!url) return 'down';
    const client = createClient({ url });
    await withTimeout(client.connect());
    await client.disconnect();
    return 'up';
  } catch {
    return 'down';
  }
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Liveness: process is up. Always cheap; no dependency calls. */
  @Get('/health')
  @HttpCode(HttpStatus.OK)
  @Header('x-api-version', '1')
  health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1',
    };
  }

  /** Readiness: dependencies are reachable. Returns 503 when not ready. */
  @Get('/ready')
  @Header('x-api-version', '1')
  async ready(@Res({ passthrough: true }) res: any) {
    const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
    const ready = database === 'up' && redis === 'up';
    if (!ready) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return {
      status: ready ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      version: '1',
      dependencies: { database, redis },
    };
  }

  @Get('/')
  root() {
    return {
      message: 'Content Automation Platform API',
      version: '1',
      endpoints: {
        health: '/health',
        ready: '/ready',
        api: '/api/v1',
      },
    };
  }
}
