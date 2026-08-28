/*
 * Jest setup - Content Automation Platform
 * Runs BEFORE test module imports:
 *  - reflect-metadata for NestJS decorators
 *  - Test environment configuration (in-memory DB, deterministic JWT secrets)
*/

import 'reflect-metadata';

// Must be set before AppModule is imported (decorator evaluation).
process.env.DB_TYPE = process.env.DB_TYPE || 'sqlite';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-value-at-least-32-characters!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-chars!';
