import { PublicationEngine, createInMemoryPublicationJobStore } from '../src/publication-engine';
import { MockPublisher, createMockTokenStore } from '../src/social-publishers/mock-publisher';
import type { PublicationRequest, SocialAccount } from '../src/social-publisher';

function makeRequest(overrides: Partial<PublicationRequest> = {}): PublicationRequest {
  return {
    idempotencyKey: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contentId: 'content-1',
    tenantId: 'tenant-1',
    platform: 'youtube',
    accountId: 'account-1',
    title: 'Test Video',
    description: 'A test publication',
    ...overrides,
  };
}

function makeAccount(overrides: Partial<SocialAccount> = {}): SocialAccount {
  return {
    id: 'account-1',
    tenantId: 'tenant-1',
    platform: 'youtube',
    accountId: 'yt-channel-123',
    accountName: 'Test Channel',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600000),
    scopes: ['youtube.upload'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('FASE 12 Publication Engine', () => {
  describe('pipeline: APPROVED → SCHEDULED → PUBLISHING → PUBLISHED', () => {
    test('full happy path: APPROVED state allows publish', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest();
      const account = makeAccount();

      // Schedule
      const job = await engine.schedule(req, account);
      expect(job.status).toBe('SCHEDULED');

      // Publish with APPROVED state
      const { job: final, result } = await engine.publish(job, account, 'APPROVED');
      expect(final.status).toBe('PUBLISHED');
      expect(result.success).toBe(true);
      expect(result.postUrl).toContain('youtube.com');
    });

    test('SCHEDULED state also allows publish', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('instagram');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest({ platform: 'instagram' });
      const account = makeAccount({ platform: 'instagram' });

      const job = await engine.schedule(req, account);
      const { job: final } = await engine.publish(job, account, 'SCHEDULED');
      expect(final.status).toBe('PUBLISHED');
    });

    test('DRAFT state blocks publish', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest();
      const account = makeAccount();

      const job = await engine.schedule(req, account);
      const { job: final, result } = await engine.publish(job, account, 'DRAFT');
      expect(final.status).toBe('FAILED');
      expect(result.success).toBe(false);
      expect(result.error).toContain('APPROVED or SCHEDULED');
    });

    test('GENERATED state blocks publish', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest();
      const account = makeAccount();

      const job = await engine.schedule(req, account);
      const { job: final } = await engine.publish(job, account, 'GENERATED');
      expect(final.status).toBe('FAILED');
    });

    test('RENDERED state blocks publish', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest();
      const account = makeAccount();

      const job = await engine.schedule(req, account);
      const { job: final } = await engine.publish(job, account, 'RENDERED');
      expect(final.status).toBe('FAILED');
    });

    test('PENDING_APPROVED state blocks publish', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('facebook');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest({ platform: 'facebook' });
      const account = makeAccount({ platform: 'facebook' });

      const job = await engine.schedule(req, account);
      const { job: final } = await engine.publish(job, account, 'PENDING_APPROVAL');
      expect(final.status).toBe('FAILED');
    });
  });

  describe('idempotency: no duplicate publications', () => {
    test('same idempotency key returns same job', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest({ idempotencyKey: 'idem-123' });
      const account = makeAccount();

      const job1 = await engine.schedule(req, account);
      const job2 = await engine.schedule({ ...req }, account);

      expect(job1.id).toBe(job2.id);
      expect(job1.idempotencyKey).toBe('idem-123');
    });

    test('cannot publish already-published content', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest();
      const account = makeAccount();

      // First publish
      const job = await engine.schedule(req, account);
      await engine.publish(job, account, 'APPROVED');

      // Check if can publish again
      const check = await engine.canPublish('content-1', 'youtube', 'APPROVED');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('already published');
    });

    test('content published on youtube can still be published on instagram', async () => {
      const store = createInMemoryPublicationJobStore();
      const ytMock = new MockPublisher('youtube');
      const igMock = new MockPublisher('instagram');
      const engine = new PublicationEngine(store, [ytMock, igMock]);

      const ytJob = await engine.schedule(
        makeRequest({ idempotencyKey: 'yt-key', platform: 'youtube' }),
        makeAccount(),
      );
      await engine.publish(ytJob, makeAccount(), 'APPROVED');

      // Same content, different platform — should be allowed
      const check = await engine.canPublish('content-1', 'instagram', 'APPROVED');
      expect(check.allowed).toBe(true);
    });
  });

  describe('workflow state verification before publish', () => {
    test('canPublish rejects DRAFT', async () => {
      const store = createInMemoryPublicationJobStore();
      const engine = new PublicationEngine(store);
      const check = await engine.canPublish('c1', 'youtube', 'DRAFT');
      expect(check.allowed).toBe(false);
    });

    test('canPublish rejects GENERATED', async () => {
      const store = createInMemoryPublicationJobStore();
      const engine = new PublicationEngine(store);
      const check = await engine.canPublish('c1', 'youtube', 'GENERATED');
      expect(check.allowed).toBe(false);
    });

    test('canPublish rejects RENDERED', async () => {
      const store = createInMemoryPublicationJobStore();
      const engine = new PublicationEngine(store);
      const check = await engine.canPublish('c1', 'youtube', 'RENDERED');
      expect(check.allowed).toBe(false);
    });

    test('canPublish allows APPROVED', async () => {
      const store = createInMemoryPublicationJobStore();
      const engine = new PublicationEngine(store, [new MockPublisher('youtube')]);
      const check = await engine.canPublish('c1', 'youtube', 'APPROVED');
      expect(check.allowed).toBe(true);
    });

    test('canPublish allows SCHEDULED', async () => {
      const store = createInMemoryPublicationJobStore();
      const engine = new PublicationEngine(store, [new MockPublisher('youtube')]);
      const check = await engine.canPublish('c1', 'youtube', 'SCHEDULED');
      expect(check.allowed).toBe(true);
    });
  });

  describe('mock publisher', () => {
    test('mock publisher works without real credentials', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest();
      const account = makeAccount();

      const job = await engine.schedule(req, account);
      const { result } = await engine.publish(job, account, 'APPROVED');

      expect(result.success).toBe(true);
      expect(result.postUrl).toContain('youtube.com');
      expect(mock.getPublishLog()).toHaveLength(1);
    });

    test('mock publisher can simulate failure', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      mock.setShouldFail(true);
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest();
      const account = makeAccount();

      const job = await engine.schedule(req, account);
      const { result } = await engine.publish(job, account, 'APPROVED');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mock');
    });

    test('mock token store persists tokens', async () => {
      const store = createMockTokenStore();
      await store.save('acc-1', 'token-123', 'refresh-456');
      const loaded = await store.load('acc-1');
      expect(loaded?.accessToken).toBe('token-123');
      expect(loaded?.refreshToken).toBe('refresh-456');
      await store.revoke('acc-1');
      expect(await store.load('acc-1')).toBeNull();
    });
  });

  describe('FASE 12 transition tests (mandatory)', () => {
    test('APPROVED → PUBLISHING → PUBLISHED works', async () => {
      const store = createInMemoryPublicationJobStore();
      const mock = new MockPublisher('youtube');
      const engine = new PublicationEngine(store, [mock]);
      const req = makeRequest();
      const account = makeAccount();

      const job = await engine.schedule(req, account);
      expect(job.status).toBe('SCHEDULED');

      const { job: mid } = await engine.publish({ ...job, status: 'APPROVED' } as any, account, 'APPROVED');
      expect(mid.status).toBe('PUBLISHED');
    });

    test('mock publisher auth URL is not a real URL', async () => {
      const mock = new MockPublisher('youtube');
      const url = mock.getAuthUrl('http://localhost/callback', 'state-1');
      expect(url).toContain('mock-youtube.com');
      expect(url).not.toContain('google.com');
    });

    test('mock exchangeCode returns mock tokens', async () => {
      const mock = new MockPublisher('instagram');
      const tokens = await mock.exchangeCode('fake-code', 'http://localhost/callback');
      expect(tokens.accessToken).toContain('mock-token-');
      expect(tokens.refreshToken).toContain('mock-refresh-');
    });
  });
});
