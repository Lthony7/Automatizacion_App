import { PublicationEngine, createInMemoryPublicationJobStore } from '../src/publication-engine';
import { MockPublisher, createMockTokenStore } from '../src/social-publishers/mock-publisher';
import type { PublicationRequest, SocialAccount } from '../src/social-publisher';

function makeReq(overrides: Partial<PublicationRequest> = {}): PublicationRequest {
  return {
    idempotencyKey: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contentId: 'content-1', tenantId: 'tenant-1', platform: 'youtube',
    accountId: 'account-1', title: 'Test Video', description: 'A test', ...overrides,
  };
}
function makeAcc(overrides: Partial<SocialAccount> = {}): SocialAccount {
  return {
    id: 'account-1', tenantId: 'tenant-1', platform: 'youtube', accountId: 'yt-123',
    accountName: 'Test', accessToken: 'tok', refreshToken: 'ref',
    expiresAt: new Date(Date.now() + 3600000), scopes: [], createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}

let passed = 0;
let failed = 0;
function assert(name: string, condition: boolean) {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

(async () => {
console.log('=== FASE 12 Publication Engine Tests ===\n');

{
  const store = createInMemoryPublicationJobStore();
  const engine = new PublicationEngine(store);
  const r1 = await engine.canPublish('c1', 'youtube', 'DRAFT');
  assert('DRAFT -> canPublish = FAIL', !r1.allowed);
  const r2 = await engine.canPublish('c1', 'youtube', 'GENERATED');
  assert('GENERATED -> canPublish = FAIL', !r2.allowed);
  const r3 = await engine.canPublish('c1', 'youtube', 'RENDERED');
  assert('RENDERED -> canPublish = FAIL', !r3.allowed);
}

{
  const store = createInMemoryPublicationJobStore();
  const engine = new PublicationEngine(store, [new MockPublisher('youtube')]);
  const r1 = await engine.canPublish('c1', 'youtube', 'APPROVED');
  assert('APPROVED -> canPublish = SUCCESS', r1.allowed);
  const r2 = await engine.canPublish('c1', 'youtube', 'SCHEDULED');
  assert('SCHEDULED -> canPublish = SUCCESS', r2.allowed);
}

{
  const store = createInMemoryPublicationJobStore();
  const mock = new MockPublisher('youtube');
  const engine = new PublicationEngine(store, [mock]);
  const job = await engine.schedule(makeReq(), makeAcc());
  assert('Initial status = SCHEDULED', job.status === 'SCHEDULED');
  const { job: final, result } = await engine.publish({ ...job, status: 'APPROVED' } as any, makeAcc(), 'APPROVED');
  assert('APPROVED -> PUBLISHED = SUCCESS', final.status === 'PUBLISHED' && result.success);
}

{
  const store = createInMemoryPublicationJobStore();
  const engine = new PublicationEngine(store, [new MockPublisher('youtube')]);
  const key = `idem-${Date.now()}`;
  const j1 = await engine.schedule(makeReq({ idempotencyKey: key }), makeAcc());
  const j2 = await engine.schedule(makeReq({ idempotencyKey: key }), makeAcc());
  assert('Idempotency: same key = same job', j1.id === j2.id);
}

{
  const store = createInMemoryPublicationJobStore();
  const mock = new MockPublisher('youtube');
  const engine = new PublicationEngine(store, [mock]);
  const job = await engine.schedule(makeReq(), makeAcc());
  await engine.publish({ ...job, status: 'APPROVED' } as any, makeAcc(), 'APPROVED');
  const check = await engine.canPublish('content-1', 'youtube', 'APPROVED');
  assert('No duplicate: already published = FAIL', !check.allowed);
}

{
  const store = createInMemoryPublicationJobStore();
  const mock = new MockPublisher('youtube');
  const engine = new PublicationEngine(store, [mock]);
  const job = await engine.schedule(makeReq(), makeAcc());
  const { result } = await engine.publish({ ...job, status: 'APPROVED' } as any, makeAcc(), 'APPROVED');
  assert('Mock publisher succeeds', result.success);
  assert('Mock URL contains youtube.com', result.postUrl?.includes('youtube.com') ?? false);
}

{
  const store = createInMemoryPublicationJobStore();
  const mock = new MockPublisher('youtube');
  mock.setShouldFail(true);
  const engine = new PublicationEngine(store, [mock]);
  const job = await engine.schedule(makeReq(), makeAcc());
  const { result } = await engine.publish({ ...job, status: 'APPROVED' } as any, makeAcc(), 'APPROVED');
  assert('Mock failure works', !result.success && (result.error?.includes('Mock') ?? false));
}

{
  const mock = new MockPublisher('youtube');
  const url = mock.getAuthUrl('http://localhost', 'state');
  assert('Mock auth URL is fake', url.includes('mock-youtube.com') && !url.includes('google.com'));
}

{
  const store = createMockTokenStore();
  await store.save('acc-1', 'token', 'refresh');
  const loaded = await store.load('acc-1');
  assert('Token store: save/load works', loaded?.accessToken === 'token');
  await store.revoke('acc-1');
  assert('Token store: revoke works', (await store.load('acc-1')) === null);
}

{
  const store = createInMemoryPublicationJobStore();
  const engine = new PublicationEngine(store, [new MockPublisher('youtube'), new MockPublisher('instagram')]);
  const job = await engine.schedule(makeReq({ platform: 'youtube' }), makeAcc());
  await engine.publish({ ...job, status: 'APPROVED' } as any, makeAcc(), 'APPROVED');
  const check = await engine.canPublish('content-1', 'instagram', 'APPROVED');
  assert('Cross-platform: yt published, ig allowed', check.allowed);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
})();

