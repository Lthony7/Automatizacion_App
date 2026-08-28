/*
 * Tenant Context Middleware — Content Automation Platform FASE 9.6
 *
 * Sets PostgreSQL session variable `app.current_tenant_id` on every request
 * so that Row-Level Security (RLS) policies can enforce tenant isolation
 * at the database level.
 *
 * Must run AFTER AuthGuard (which populates req.tenantId from JWT).
 *
 * Usage in a NestJS module:
 *   @Module({
 *     imports: [TypeOrmModule.forFeature([...])],
 *     providers: [TenantContextMiddleware],
 *   })
 *   export class AppModule implements NestModule {
 *     configure(consumer: MiddlewareConsumer) {
 *       consumer.apply(TenantContextMiddleware).forRoutes('*');
 *     }
 *   }
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = (req as any).tenantId;

    if (tenantId && this.dataSource.driver.constructor.name !== 'BetterSqlite3Driver') {
      // Set the session variable for RLS policies (PostgreSQL only)
      // Using a parameterized query to prevent SQL injection
      await this.dataSource.query(
        `SET LOCAL app.current_tenant_id = $1`,
        [tenantId],
      );
    }

    next();
  }
}
