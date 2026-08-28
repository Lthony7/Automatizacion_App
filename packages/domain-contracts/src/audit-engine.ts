/**
 * FASE 16: Audit Engine.
 *
 * Registra audit con el esquema exacto del spec:
 * tenant, user, action, resource, resource_id, timestamp, result, metadata
 * NUNCA almacenar secretos en logs — sanitización profunda antes de persistir.
 *
 * Genérico: no existe UserAuditService por vertical.
 */

export type AuditResult = 'success' | 'failure'

export interface AuditRecord {
  tenant: string
  user: string
  action: string
  resource: string
  resource_id: string
  timestamp: Date
  result: AuditResult
  metadata?: Record<string, unknown>
}

export interface AuditRecordInput extends Omit<AuditRecord, 'timestamp'> {
  timestamp?: Date
}

export interface AuditStore {
  append(record: AuditRecord): Promise<void>
  list(tenant: string, filter?: { user?: string; action?: string; resource?: string; result?: AuditResult }): Promise<AuditRecord[]>
  getAll(): AuditRecord[]
}

export function createInMemoryAuditStore(): AuditStore {
  const records: AuditRecord[] = []
  return {
    async append(record) {
      records.push({ ...record, metadata: record.metadata ? { ...record.metadata } : undefined })
    },
    async list(tenant, filter) {
      return records.filter((r) => {
        if (r.tenant !== tenant) return false
        if (filter?.user && r.user !== filter.user) return false
        if (filter?.action && r.action !== filter.action) return false
        if (filter?.resource && r.resource !== filter.resource) return false
        if (filter?.result && r.result !== filter.result) return false
        return true
      })
    },
    getAll() {
      return [...records]
    },
  }
}

// ---------------------------------------------------------------------------
// Secret sanitization — never store secrets in logs
// ---------------------------------------------------------------------------

const SECRET_KEY_PATTERNS = [
  'password',
  'secret',
  'token',
  'apikey',
  'privatekey',
  'credentials',
  'authorization',
  'bearer',
]

function isSecretKey(key: string): boolean {
  const norm = key.toLowerCase().replace(/[^a-z]/g, '')
  return SECRET_KEY_PATTERNS.some((p) => norm.includes(p))
}

export function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    // Redact long bearer-like tokens
    if (value.length > 20 && /^[A-Za-z0-9\-_\.=+/]+$/.test(value) && (value.startsWith('eyJ') || value.includes('sk-') || value.length > 40)) {
      return '[REDACTED]'
    }
    return value
  }
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSecretKey(k)) out[k] = '[REDACTED]'
      else out[k] = sanitizeValue(v)
    }
    return out
  }
  return value
}

export function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined
  return sanitizeValue(metadata) as Record<string, unknown>
}

export class AuditEngine {
  constructor(private readonly store: AuditStore) {}

  async record(input: AuditRecordInput): Promise<AuditRecord> {
    const record: AuditRecord = {
      ...input,
      timestamp: input.timestamp ?? new Date(),
      metadata: sanitizeMetadata(input.metadata),
    }
    await this.store.append(record)
    return record
  }

  async list(
    tenant: string,
    filter?: { user?: string; action?: string; resource?: string; result?: AuditResult },
  ): Promise<AuditRecord[]> {
    return this.store.list(tenant, filter)
  }
}
