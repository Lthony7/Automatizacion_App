/*
 * Audit Module — Content Automation Platform
 * Provides AuditStore via NestJS DI.
 */

import { Module, Global, Provider } from '@nestjs/common';
import { createInMemoryAuditStore } from 'domain-contracts/audit-engine';

export const AUDIT_STORE = 'AUDIT_STORE';

const auditStoreProvider: Provider = {
  provide: AUDIT_STORE,
  useFactory: () => createInMemoryAuditStore(),
};

@Global()
@Module({
  providers: [auditStoreProvider],
  exports: [auditStoreProvider],
})
export class AuditModule {}
