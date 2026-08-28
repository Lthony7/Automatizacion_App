import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { createHash } from 'crypto';
import { getTokenBlacklist } from './token-blacklist';

function tokenFingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autorización requerido');
    }

    const token = authorization.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.includes('change-this')) {
      throw new UnauthorizedException('Server JWT misconfiguration');
    }
    let payload: any;
    try {
      payload = verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'content-automation',
        audience: 'api',
      } as any);
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') throw new UnauthorizedException('Token expirado');
      throw new UnauthorizedException('Token inválido');
    }

    if (!payload || !payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token inválido');
    }

    // H-01: reject revoked (logged-out) tokens
    if (await getTokenBlacklist().isRevoked(tokenFingerprint(token))) {
      throw new UnauthorizedException('Token revocado');
    }

    request.tenantId = payload.tenantId;
    request.userId = payload.sub;
    request.role = payload.role;

    return true;
  }
}