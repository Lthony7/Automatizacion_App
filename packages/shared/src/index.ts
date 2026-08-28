/*
 * Shared Package - Content Automation Platform
 * FASE 1: Foundation Structure
 * Shared utilities, types, and decorators used across apps and packages
*/

export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

export function assertTenantContext(ctx: Partial<TenantContext> | undefined): asserts ctx is TenantContext {
  if (!ctx || !ctx.tenantId) {
    throw new Error('Missing tenant context');
  }
}
