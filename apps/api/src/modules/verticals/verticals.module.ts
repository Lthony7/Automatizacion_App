/*
 * Verticals Module - FASE 15
 * Exposes vertical metadata (navigation + dashboard config).
 *
 * DECISION (FASE 9.6 — documented per audit requirement):
 * Metadata is PUBLIC by design. It contains no tenant data, no PII and no
 * secrets — only static UI configuration (nav ids, labels, categories) that is
 * identical for every tenant. Keeping it public lets the login screen render
 * branding before authentication. If tenant-aware metadata (e.g., custom
 * categories per tenant) is introduced later, add AuthGuard to this module.
*/

import { Module } from '@nestjs/common';
import { VerticalsController } from './verticals.controller';

@Module({
  providers: [],
  controllers: [VerticalsController],
  exports: [],
})
export class VerticalsModule {}
