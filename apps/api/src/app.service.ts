/*
 * App Service - Content Automation Platform API
 * FASE 1: Foundation Structure
 * Core service with multi-tenancy support
 * Structured logging integration
*/

import { Injectable } from '@nestjs/common';
import { logger } from './infra/logging/custom.logger';

@Injectable()
export class AppService {
  private readonly logger: typeof logger = logger;

  constructor() {
    this.logger.info('AppService initialized', {
      phase: 'FASE_1',
      timestamp: new Date().toISOString(),
    });
  }

  getHealth() {
    return {
      status: 'ok',
      phase: 'FASE_1',
      timestamp: new Date().toISOString(),
    };
  }

  getReady() {
    return {
      status: 'ready',
      phase: 'FASE_1',
      timestamp: new Date().toISOString(),
    };
  }

  getVersion() {
    return {
      version: '1.0.0-fase1',
      phase: 'FASE_1',
      description: 'Content Automation Platform - Foundation Structure',
    };
  }

  logInfo(context: string, message: string, meta?: any) {
    this.logger.info({ context, ...(meta || {}) }, message);
  }

  logError(context: string, message: string, meta?: any, error?: Error) {
    const metaWithError = error
      ? { ...(meta || {}), error: { message: error.message, stack: error.stack } }
      : (meta || {});
    this.logger.error({ context, ...(metaWithError || {}) }, message);
  }

  logDebug(context: string, message: string, meta?: any) {
    this.logger.debug({ context, ...(meta || {}) }, message);
  }
}