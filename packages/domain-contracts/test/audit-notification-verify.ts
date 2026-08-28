import { AuditEngine, createInMemoryAuditStore, sanitizeValue } from '../src/audit-engine'
import { NotificationEngine, createInMemoryNotificationStore, EmailChannel, TelegramChannel, GenericChannel, APP_EVENTS } from '../src/notification-engine'

let passed = 0; let failed = 0
function assert(name: string, condition: boolean) {
  if (condition) { passed++; console.log(`  OK ${name}`) }
  else { failed++; console.log(`  FAIL ${name}`) }
}

(async () => {
console.log('=== FASE 16 Notification + Audit Engines ===\n')

// Events completeness
assert('APP_EVENTS has 10 events', APP_EVENTS.length === 10)
assert('all required events present', ['video_generated','video_failed','review_pending','video_approved','video_rejected','publication_succeeded','publication_failed','budget_reached','api_key_revoked','domain_validation_failed'].every((e) => (APP_EVENTS as readonly string[]).includes(e)))

// Audit: required fields
{
  const engine = new AuditEngine(createInMemoryAuditStore())
  const r = await engine.record({ tenant: 't1', user: 'u1', action: 'video_approved', resource: 'video', resource_id: 'v1', result: 'success', metadata: { via: 'review' } })
  assert('Audit has tenant/user/action/resource/resource_id/timestamp/result/metadata',
    r.tenant==='t1' && r.user==='u1' && r.action==='video_approved' && r.resource==='video' && r.resource_id==='v1' && r.result==='success' && r.timestamp instanceof Date)
}

// Audit: never stores secrets
{
  const store = createInMemoryAuditStore()
  const engine = new AuditEngine(store)
  await engine.record({ tenant: 't1', user: 'u1', action: 'api_key_revoked', resource: 'api_key', resource_id: 'k1', result: 'success', metadata: { apiKey: 'sk-live-abc1234567890', accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6', nested: { refreshToken: 'rt', safe: 'keep' } as Record<string, unknown> } })
  const m = store.getAll()[0].metadata as Record<string, unknown>
  const nested = m.nested as Record<string, unknown>
  assert('Audit sanitizes apiKey', m.apiKey === '[REDACTED]')
  assert('Audit sanitizes accessToken', m.accessToken === '[REDACTED]')
  assert('Audit sanitizes nested refreshToken', nested.refreshToken === '[REDACTED]')
  assert('Audit keeps safe field', nested.safe === 'keep')
}

// Audit: deep sanitization helper
assert('sanitizeValue redacts password', (sanitizeValue({ password: '123', ok: 1 }) as Record<string, unknown>).password === '[REDACTED]')
assert('sanitizeValue keeps non-secret', (sanitizeValue({ note: 'hello' }) as Record<string, unknown>).note === 'hello')

// Notification: internal
{
  const engine = new NotificationEngine(createInMemoryNotificationStore())
  const n = await engine.notify({ tenant: 't1', event: 'video_generated', resource: 'video', resource_id: 'v1' })
  assert('Notification internal created', n.event==='video_generated' && n.tenant==='t1' && !n.read)
  const list = await engine.list('t1')
  assert('list returns 1', list.length===1)
}

// Notification: never stores secrets
{
  const store = createInMemoryNotificationStore()
  const engine = new NotificationEngine(store)
  const n = await engine.notify({ tenant: 't1', event: 'api_key_revoked', metadata: { token: 'eyJ999', secret: 'shh' } })
  assert('Notification sanitizes metadata', n.metadata?.token==='[REDACTED]' && n.metadata?.secret==='[REDACTED]')
}

// Notification: Email + Telegram via interface
{
  const store = createInMemoryNotificationStore()
  const email = new EmailChannel()
  const telegram = new TelegramChannel('fake')
  const engine = new NotificationEngine(store, [email, telegram])
  await engine.notify({ tenant: 't1', event: 'publication_succeeded' })
  assert('EmailChannel receives dispatch', email.sent.length===1 && email.sent[0].event==='publication_succeeded')
  assert('TelegramChannel receives dispatch', telegram.sent.length===1)
}

// GenericChannel extensibility
{
  const store = createInMemoryNotificationStore()
  const slack = new GenericChannel('slack')
  const engine = new NotificationEngine(store, [slack])
  await engine.notify({ tenant: 't1', event: 'budget_reached' })
  assert('GenericChannel works (otros proveedores)', slack.sent.length===1)
}

// Channel failure isolation
{
  const store = createInMemoryNotificationStore()
  const failing = { id: 'failing', async send() { throw new Error('down') } }
  const engine = new NotificationEngine(store, [failing as import('../src/notification-engine').NotificationChannel])
  const n = await engine.notify({ tenant: 't1', event: 'video_failed' })
  assert('Channel failure does not break internal notification', n.event==='video_failed' && (await engine.list('t1')).length===1)
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
process.exit(failed>0?1:0)
})()
