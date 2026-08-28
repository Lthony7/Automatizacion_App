/*
 * Tenants Service Tests — FASE 9.6
 */

import { TenantsService } from '../src/modules/tenants/tenants.service';

function makeMockRepo() {
  const store: any[] = [];
  return {
    find: jest.fn().mockImplementation((opts: any) => {
      const where = opts?.where;
      if (where?.id) return Promise.resolve(store.filter((t) => t.id === where.id));
      return Promise.resolve([...store]);
    }),
    findOne: jest.fn().mockImplementation((opts: any) => {
      const where = opts?.where;
      return Promise.resolve(store.find((t) => t.id === where?.id || t.name === where?.name) || null);
    }),
    create: jest.fn().mockImplementation((data: any) => ({ id: 'mock-id-' + Date.now(), ...data })),
    save: jest.fn().mockImplementation((entity: any) => {
      if (!entity.id) entity.id = 'mock-id-' + Date.now();
      store.push(entity);
      return Promise.resolve(entity);
    }),
    _store: store,
  };
}

describe('TenantsService', () => {
  let service: TenantsService;
  let repo: ReturnType<typeof makeMockRepo>;

  beforeEach(() => {
    repo = makeMockRepo();
    service = new TenantsService(repo as any);
  });

  describe('create', () => {
    it('creates a tenant when requester is OWNER', async () => {
      const result = await service.create('TestTenant', 'free', undefined, 'OWNER');
      expect(result.name).toBe('TestTenant');
      expect(result.plan).toBe('free');
      expect(result.status).toBe('active');
    });

    it('creates a tenant when requester is ADMIN', async () => {
      const result = await service.create('AdminTenant', 'pro', undefined, 'ADMIN');
      expect(result.name).toBe('AdminTenant');
    });

    it('rejects creation by EDITOR', async () => {
      await expect(service.create('BadTenant', 'free', undefined, 'EDITOR')).rejects.toThrow('Solo OWNER/ADMIN puede crear tenants');
    });

    it('rejects creation with no role', async () => {
      await expect(service.create('BadTenant', 'free', undefined, undefined)).rejects.toThrow('Solo OWNER/ADMIN puede crear tenants');
    });
  });

  describe('findOne', () => {
    it('returns tenant when ID matches', async () => {
      const t = await service.create('MyTenant', 'free', undefined, 'OWNER');
      const found = await service.findOne(t.id, t.id);
      expect(found.id).toBe(t.id);
    });

    it('throws when ID does not match requester tenant', async () => {
      await expect(service.findOne('other-tenant', 'my-tenant')).rejects.toThrow('Tenant no encontrado');
    });
  });

  describe('findAll', () => {
    it('returns only the requester tenant', async () => {
      await service.create('T1', 'free', undefined, 'OWNER');
      const result = await service.findAll('mock-id-1');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
