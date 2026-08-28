/*
 * Audit Interceptor — Content Automation Platform FASE 9.6
 *
 * NestJS interceptor that logs every mutating request (POST, PUT, PATCH, DELETE)
 * to the AuditEngine. Read-only requests (GET) are logged only for protected routes.
 *
 * Usage:
 *   app.useGlobalInterceptors(new AuditInterceptor(auditStore));
 *
 * or per-controller:
 *   @UseInterceptors(AuditInterceptor)
 *   @Controller('content')
 *   export class ContentController {}
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import type { AuditStore, AuditResult } from 'domain-contracts/audit-engine';
import { sanitizeMetadata } from 'domain-contracts/audit-engine';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditStore: AuditStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const method = req.method;
    const path = req.path;
    const tenantId = req.tenantId || 'unknown';
    const userId = req.userId || 'anonymous';
    const action = `${method} ${path}`;
    const resource = path.split('/')[1] || 'unknown'; // /content/123 → content
    const resourceId = path.split('/')[2] || '';

    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        this.log({
          tenant: tenantId,
          user: userId,
          action,
          resource,
          resource_id: resourceId,
          result: 'success',
          metadata: {
            statusCode: res.statusCode,
            durationMs,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });
      }),
      catchError((err) => {
        const durationMs = Date.now() - startedAt;
        this.log({
          tenant: tenantId,
          user: userId,
          action,
          resource,
          resource_id: resourceId,
          result: 'failure',
          metadata: {
            statusCode: err?.status || 500,
            durationMs,
            error: err?.message,
            ip: req.ip,
          },
        });
        return throwError(() => err);
      }),
    );
  }

  private log(input: {
    tenant: string;
    user: string;
    action: string;
    resource: string;
    resource_id: string;
    result: AuditResult;
    metadata?: Record<string, unknown>;
  }): void {
    const sanitized = input.metadata ? sanitizeMetadata(input.metadata) : undefined;
    this.auditStore.append({
      ...input,
      timestamp: new Date(),
      metadata: sanitized as Record<string, unknown>,
    }).catch(() => {
      // Audit failures should never crash the request
    });
  }
}
