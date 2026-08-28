import { AuditEngine, createInMemoryAuditStore } from '../src/audit-engine'
import {
  NotificationEngine,
  createInMemoryNotificationStore,
  EmailChannel,
  TelegramChannel,
  GenericChannel,
  APP_EVENTS,
} from '../src/notification-engine'

describe('FASE 16 Notification + Audit Engines', () => {
  test('APP_EVENTS contains the 10 required events', () => {
    expect(APP_EVENTS).toHaveLength(10)
    for (const e of [
      'video_generated', 'video_failed', 'review_pending', 'video_approved', 'video_rejected',
      'publication_succeeded', 'publication_failed', 'budget_reached', 'api_key_revoked', 'domain_validation_failed',
    ]) {
      expect(APP_EVENTS).toContain(e)
    }
  })

  describe('AuditEngine', () => {
    test('stores required fields: tenant, user, action, resource, resource_id, timestamp, result, metadata', async () => {
      const engine = new AuditEngine(createInMemoryAuditStore())
      const rec = await engine.record({
        tenant: 't1', user: 'u1', action: 'video_approved', resource: 'video', resource_id: 'v1',
        result: 'success', metadata: { via: 'review' },
      })
      expect(rec.tenant).toBe('t1')
      expect(rec.user).toBe('u1')
      expect(rec.action).toBe('video_approved')
      expect(rec.resource).toBe('video')
      expect(rec.resource_id).toBe('v1')
      expect(rec.result).toBe('success')
      expect(rec.timestamp).toBeInstanceOf(Date)
      expect(rec.metadata).toEqual({ via: 'review' })
    })

    test('never stores secrets in metadata', async () => {
      const store = createInMemoryAuditStore()
      const engine = new AuditEngine(store)
      await engine.record({
        tenant: 't1', user: 'u1', action: 'api_key_revoked', resource: 'api_key', resource_id: 'k1',
        result: 'success',
        metadata: {
          apiKey: 'sk-live-1234567890abcdef',
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload',
          nested: { refreshToken: 'rt-secret', safe: 'keep' },
        },
      })
      const all = store.getAll()
      expect(all[0].metadata).toEqual({
        apiKey: '[REDACTED]',
        accessToken: '[REDACTED]',
        nested: { refreshToken: '[REDACTED]', safe: 'keep' },
      })
    })
  })

  describe('NotificationEngine', () => {
    test('creates internal notification for each event', async () => {
      const engine = new NotificationEngine(createInMemoryNotificationStore())
      const n = await engine.notify({ tenant: 't1', event: 'video_generated', resource: 'video', resource_id: 'v1' })
      expect(n.event).toBe('video_generated')
      expect(n.tenant).toBe('t1')
      expect(n.read).toBe(false)
      expect(n.createdAt).toBeInstanceOf(Date)
      const list = await engine.list('t1')
      expect(list).toHaveLength(1)
    })

    test('never exposes secrets in internal notification metadata', async () => {
      const store = createInMemoryNotificationStore()
      const engine = new NotificationEngine(store)
      const n = await engine.notify({
        tenant: 't1', event: 'api_key_revoked', metadata: { token: 'eyJ999', secret: 'shh' },
      })
      expect(n.metadata).toEqual({ token: '[REDACTED]', secret: '[REDACTED]' })
      expect(store.getAll()[0].metadata).toEqual({ token: '[REDACTED]', secret: '[REDACTED]' })
    })

    test('dispatches to Email and Telegram via interface without hardcoding', async () => {
      const store = createInMemoryNotificationStore()
      const email = new EmailChannel()
      const telegram = new TelegramChannel('fake-token')
      const engine = new NotificationEngine(store, [email, telegram])
      await engine.notify({ tenant: 't1', event: 'publication_succeeded' })

      expect(email.sent).toHaveLength(1)
      expect(telegram.sent).toHaveLength(1)
      expect(email.sent[0].event).toBe('publication_succeeded')
    })

    test('other providers can be registered via the same interface', async () => {
      const store = createInMemoryNotificationStore()
      const generic = new GenericChannel('slack')
      const engine = new NotificationEngine(store, [generic])
      await engine.notify({ tenant: 't1', event: 'budget_reached' })
      expect(generic.sent).toHaveLength(1)
    })

    test('channel failure does not break internal notification', async () => {
      const store = createInMemoryNotificationStore()
      const failing: import('../src/notification-engine').NotificationChannel = {
        id: 'failing',
        async send() { throw new Error('provider down') },
      }
      const engine = new NotificationEngine(store, [failing])
      const n = await engine.notify({ tenant: 't1', event: 'video_failed' })
      expect(n.event).toBe('video_failed')
      expect(await engine.list('t1')).toHaveLength(1)
    })
  })
})
