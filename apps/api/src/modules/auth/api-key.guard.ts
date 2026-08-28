/*
 * API Key Guard - Content Automation Platform
 * Validates Bearer sk_... tokens against the api_keys table.
 * Falls back to JWT guard if the token doesn't start with sk_.
 *
 * Usage: @UseGuards(ApiKeyOrJwtGuard) on controllers/endpoints.
 */

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);

    // API key path: sk_... prefix
    if (token.startsWith('sk_')) {
      return this.validateApiKey(token, req);
    }

    // JWT path: delegate to standard JWT verification
    return this.validateJwt(token, req);
  }

  private async validateApiKey(rawKey: string, req: any): Promise<boolean> {
    // We store bcrypt hashes, so we need to compare against all active keys
    // for the prefix. For performance, we extract the prefix first.
    const prefix = rawKey.slice(0, 16);

    // Find candidate keys by prefix (fast lookup)
    const candidates = await this.apiKeyRepo.find({
      where: { prefix, status: 'active' as const },
    });

    if (candidates.length === 0) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Compare bcrypt hash
    for (const keyRecord of candidates) {
      const match = await bcrypt.compare(rawKey, keyRecord.hash);
      if (match) {
        // Attach tenant context
        req.tenantId = keyRecord.tenantId;
        req.apiKeyId = keyRecord.id;
        req.authMethod = 'api_key';

        // Track usage (fire-and-forget)
        this.apiKeyRepo.update(keyRecord.id, { lastUsedAt: new Date() }).catch(() => {});

        return true;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }

  private validateJwt(token: string, req: any): boolean {
    try {
      if (!JWT_SECRET || JWT_SECRET.length < 32) {
        throw new UnauthorizedException('JWT_SECRET not configured');
      }

      const payload = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'content-automation',
        audience: 'api',
      }) as any;

      req.userId = payload.sub;
      req.tenantId = payload.tenantId;
      req.role = payload.role;
      req.authMethod = 'jwt';

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
