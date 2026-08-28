/*
 * API E2E Tests - Content Automation Platform (FASE 9.6 / FASE 23)
 * Boots the full Nest app against an in-memory database (no external services).
 *
 * Coverage:
 *   - Health/liveness endpoint
 *   - Auth: register → login → protected route → logout blacklisting
 *   - Multi-tenant isolation (FASE 14): tenant B resources invisible to tenant A
 *   - Tenant creation authorization (Fase 5): only OWNER/ADMIN allowed
*/

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setTokenBlacklist, InMemoryTokenBlacklist } from '../src/modules/auth/token-blacklist';
import { Tenant } from '../src/entities/tenant.entity';

describe('API E2E (FASE 9.6)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';

  async function seedTenant(id: string, name: string) {
    const repo = dataSource.getRepository(Tenant);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) {
      await repo.insert({ id, name });
    }
  }

  async function registerUser(tenantId: string, email: string) {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Sup3rSecure!', tenantId, name: 'Test User' });
    return res;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setTokenBlacklist(new InMemoryTokenBlacklist());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await seedTenant(TENANT_A, 'tenant-a');
    await seedTenant(TENANT_B, 'tenant-b');
  });

  afterAll(async () => {
    await app.close();
  });

  test('GET /health returns healthy', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('healthy');
  });

  test('register returns access token', async () => {
    const res = await registerUser(TENANT_A, `owner-a-${Date.now()}@test.dev`);
    if (res.status !== 201 && res.status !== 200) {
      // Surface server error details for debugging without failing silently
      throw new Error(`register failed (${res.status}): ${JSON.stringify(res.body)}`);
    }
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('login works after register', async () => {
    const email = `login-a-${Date.now()}@test.dev`;
    await registerUser(TENANT_A, email);
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Sup3rSecure!', tenantId: TENANT_A });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('login rejects wrong password', async () => {
    const email = `wrong-pw-${Date.now()}@test.dev`;
    await registerUser(TENANT_A, email);
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPassword!', tenantId: TENANT_A });
    expect(res.status).toBe(401);
  });

  test('projects are tenant-scoped (FASE 14)', async () => {
    // Create a project as tenant A user
    const emailA = `proj-a-${Date.now()}@test.dev`;
    const regA = await registerUser(TENANT_A, emailA);
    expect(regA.body?.data?.accessToken).toBeDefined();
    const tokenA = regA.body.data.accessToken as string;

    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Project A' });
    expect([200, 201]).toContain(created.status);

    // Register tenant B user and list projects → must NOT see Project A
    const emailB = `proj-b-${Date.now()}@test.dev`;
    const regB = await registerUser(TENANT_B, emailB);
    expect(regB.body?.data?.accessToken).toBeDefined();
    const tokenB = regB.body.data.accessToken as string;

    const listB = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    const names = JSON.stringify(listB.body);
    expect(names).not.toContain('Project A');
  });

  test('tenant creation requires OWNER/ADMIN role (Fase 5)', async () => {
    const email = `viewer-${Date.now()}@test.dev`;
    const reg = await registerUser(TENANT_A, email);
    const token = reg.body?.data?.accessToken;
    expect(token).toBeDefined();

    // Demote this user to VIEWER via the users endpoint
    const userId = reg.body?.data?.user?.id;
    expect(userId).toBeDefined();
    await request(app.getHttpServer())
      .post(`/users/${userId}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'VIEWER' });

    // Login again to obtain a token carrying the VIEWER role
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Sup3rSecure!', tenantId: TENANT_A });
    expect([200, 201]).toContain(loginRes.status);
    const viewerToken = loginRes.body.data.accessToken;

    const res = await request(app.getHttpServer())
      .post('/tenants')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: `new-tenant-${Date.now()}` });
    // VIEWER must never be allowed to create tenants (backend-enforced)
    expect(res.status).toBe(403);
  });

  test('logout blacklists the presented token (H-01)', async () => {
    const email = `logout-${Date.now()}@test.dev`;
    const reg = await registerUser(TENANT_A, email);
    const token = reg.body?.data?.accessToken;
    expect(token).toBeDefined();

    // Token valid before logout
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => expect([200, 403]).toContain(res.status));

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => expect([200, 201]).toContain(res.status));

    // Same token rejected after logout
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  test('protected routes reject missing/invalid tokens', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer garbage.token.here')
      .expect(401);
  });
});
