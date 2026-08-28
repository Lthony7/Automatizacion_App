/**
 * FASE 16: Notification Engine.
 *
 * Eventos del spec (10):
 *  video_generated, video_failed, review_pending, video_approved, video_rejected,
 *  publication_succeeded, publication_failed, budget_reached, api_key_revoked,
 *  domain_validation_failed
 *
 * Crea notificaciones internas y despacha a proveedores externos
 * (Email, Telegram, otros) mediante interfaces — nunca hardcodeado.
 */

import { sanitizeMetadata } from './audit-engine'

export const APP_EVENTS = [
  'video_generated',
  'video_failed',
  'review_pending',
  'video_approved',
  'video_rejected',
  'publication_succeeded',
  'publication_failed',
  'budget_reached',
  'api_key_revoked',
  'domain_validation_failed',
] as const

export type AppEvent = (typeof APP_EVENTS)[number]

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface Notification {
  id: string
  tenant: string
  user?: string
  event: AppEvent
  title: string
  body: string
  severity: NotificationSeverity
  resource?: string
  resource_id?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  read: boolean
}

export interface NotificationInput {
  tenant: string
  user?: string
  event: AppEvent
  title?: string
  body?: string
  severity?: NotificationSeverity
  resource?: string
  resource_id?: string
  metadata?: Record<string, unknown>
}

export interface NotificationStore {
  append(notification: Notification): Promise<void>
  list(tenant: string): Promise<Notification[]>
  markRead(tenant: string, id: string): Promise<void>
  getAll(): Notification[]
}

export function createInMemoryNotificationStore(): NotificationStore {
  const items: Notification[] = []
  return {
    async append(n) {
      items.push({ ...n })
    },
    async list(tenant) {
      return items.filter((n) => n.tenant === tenant)
    },
    async markRead(tenant, id) {
      const n = items.find((x) => x.tenant === tenant && x.id === id)
      if (n) n.read = true
    },
    getAll() {
      return [...items]
    },
  }
}

// ---------------------------------------------------------------------------
// Channel providers — Email, Telegram, otros vía interfaz genérica
// ---------------------------------------------------------------------------

export interface NotificationChannel {
  readonly id: string
  send(notification: Notification): Promise<void>
}

export class EmailChannel implements NotificationChannel {
  readonly id = 'email'
  public sent: Notification[] = []
  constructor(private readonly fromAddress = 'noreply@automation.local') {}

  async send(notification: Notification): Promise<void> {
    // In production: SES / SendGrid. Here we only record; never store secrets.
    this.sent.push({ ...notification, metadata: sanitizeMetadata(notification.metadata) as Record<string, unknown> | undefined })
    void this.fromAddress
  }
}

export class TelegramChannel implements NotificationChannel {
  readonly id = 'telegram'
  public sent: Notification[] = []
  constructor(private readonly botToken?: string) {}

  async send(notification: Notification): Promise<void> {
    // In production: Telegram Bot API. We record the sanitized copy.
    this.sent.push({ ...notification, metadata: sanitizeMetadata(notification.metadata) as Record<string, unknown> | undefined })
    void this.botToken
  }
}

/** Generic channel for extensibility (e.g. Slack, Webhook...). */
export class GenericChannel implements NotificationChannel {
  constructor(public readonly id: string) {}
  public sent: Notification[] = []
  async send(notification: Notification): Promise<void> {
    this.sent.push({ ...notification })
  }
}

function defaultTitle(event: AppEvent): string {
  const map: Record<AppEvent, string> = {
    video_generated: 'Video generado',
    video_failed: 'Video falló',
    review_pending: 'Revisión pendiente',
    video_approved: 'Video aprobado',
    video_rejected: 'Video rechazado',
    publication_succeeded: 'Publicación exitosa',
    publication_failed: 'Publicación fallida',
    budget_reached: 'Presupuesto alcanzado',
    api_key_revoked: 'API key revocada',
    domain_validation_failed: 'Validación de dominio falló',
  }
  return map[event]
}

function defaultSeverity(event: AppEvent): NotificationSeverity {
  if (event === 'video_failed' || event === 'publication_failed' || event === 'domain_validation_failed') return 'error'
  if (event === 'budget_reached' || event === 'api_key_revoked') return 'critical'
  if (event === 'review_pending' || event === 'video_rejected') return 'warning'
  return 'info'
}

export class NotificationEngine {
  private channels = new Map<string, NotificationChannel>()
  private seq = 0

  constructor(
    private readonly store: NotificationStore,
    channels: NotificationChannel[] = [],
  ) {
    for (const c of channels) this.channels.set(c.id, c)
  }

  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel)
  }

  async notify(input: NotificationInput): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${++this.seq}-${Date.now()}`,
      tenant: input.tenant,
      user: input.user,
      event: input.event,
      title: input.title ?? defaultTitle(input.event),
      body: input.body ?? defaultTitle(input.event),
      severity: input.severity ?? defaultSeverity(input.event),
      resource: input.resource,
      resource_id: input.resource_id,
      metadata: sanitizeMetadata(input.metadata),
      createdAt: new Date(),
      read: false,
    }

    await this.store.append(notification)
    for (const ch of this.channels.values()) {
      try {
        await ch.send(notification)
      } catch {
        // Channel failure must not break internal notification
      }
    }
    return notification
  }

  async list(tenant: string): Promise<Notification[]> {
    return this.store.list(tenant)
  }

  async markRead(tenant: string, id: string): Promise<void> {
    await this.store.markRead(tenant, id)
  }
}
