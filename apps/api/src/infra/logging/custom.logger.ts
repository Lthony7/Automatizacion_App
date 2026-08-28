/*
 * Structured Logger - Content Automation Platform
 * Winston-based logger with JSON format for production, development format for local
 * Includes: timestamp, level, message, context, requestId, tenantId
 *
 * FASE 9.6 stabilization:
 *  - Self-contained X-Request-ID middleware (validates incoming header or generates
 *    a crypto-random id; echoes it back on every response).
 *  - Secret redaction: password/token/secret/apiKey/authorization fields never reach logs.
 *  - Fixed winston call signatures (message first, metadata second).
 */

import winston from 'winston';
import { randomUUID } from 'crypto';

/** Keys whose values must never be logged. */
const REDACT_KEYS = /^(password|secret|token|accesstoken|refreshtoken|apikey|api_key|authorization|bearer)$/i;

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (REDACT_KEYS.test(k)) {
      out[k] = '[REDACTED]';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = redact(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Development transport (console)
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, context, ...metadata }) => {
        const rest = { ...metadata };
        delete rest.tenant_id;
        delete rest.request_id;
        const meta = Object.keys(rest).length ? JSON.stringify(redact(rest), null, 2) : '';
        return `${timestamp} ${level} ${String(message)}${context ? ` [${context}]` : ''}${meta ? `\n${meta}` : ''}`;
      }),
    ),
  }),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  );
}

// Logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  transports,
  exitOnError: false,
});

const REQUEST_ID_HEADER = 'x-request-id';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Request ID middleware: reuse valid incoming X-Request-ID, else generate one. */
export const requestIdMiddleware = (req: any, res: any, next: any) => {
  const incoming = req.headers?.[REQUEST_ID_HEADER];
  const requestId = typeof incoming === 'string' && UUID_RE.test(incoming) ? incoming : randomUUID();

  req.id = requestId;
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  const tenantId = req.headers?.['x-tenant-id'];
  if (tenantId) {
    logger.debug('Request received', { request_id: requestId, tenant_id: String(tenantId) });
  }

  next();
};

// Logger with tenant context helper
export const logWithTenant = (_tenantId: string, _context: string, _meta?: any) => logger;

// Logger levels convenience methods
export const logInfo = (context: string, message: string, meta?: any) => {
  logger.info(message, redact({ context, ...(meta || {}) }));
};

export const logError = (context: string, message: string, meta?: any, error?: Error) => {
  const extra = error
    ? { ...(meta || {}), error: { message: error.message } } // no stack in prod logs by default
    : meta || {};
  logger.error(message, redact({ context, ...extra }));
};

export const logWarn = (context: string, message: string, meta?: any) => {
  logger.warn(message, redact({ context, ...(meta || {}) }));
};

export const logDebug = (context: string, message: string, meta?: any) => {
  logger.debug(message, redact({ context, ...(meta || {}) }));
};

export const logVerbose = (context: string, message: string, meta?: any) => {
  logger.verbose(message, redact({ context, ...(meta || {}) }));
};

export default logger;
