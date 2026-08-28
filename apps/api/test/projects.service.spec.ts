/*
 * Projects Service Tests — FASE 9.6
 */

import { ProjectsService } from '../src/modules/projects/projects.service';

function makeMockProjectRepo() {
  const store: any[] = [];
  return {
    find: jest.fn().mockImplementation((opts: any) => {
      const where = opts?.where;
      if (where?.tenant?.id) return Promise.resolve(store.filter((p) => p.tenant?.id === where.tenant.id));
      return Promise.resolve([...store]);
    }),
    findOne: jest.fn().mockImplementation((opts: any) => {
      const where = opts?.where;
      return Promise.resolve(
        store.find((p) => p.id === where?.id && p.tenant?.id === where?.tenant?.id) || null,
      );
    }),
    create: jest.fn().mockImplementation((data: any) => ({ id: 'proj-' + Date.now(), ...data })),
    save: jest.fn().mockImplementation((entity: any) => {
      if (!entity.id) entity.id = 'proj-' + Date.now();
      store.push(entity);
      return Promise.resolve(entity);
    }),
    _store: store,
  };
}

function makeMockTenantRepo() {
  const tenants: any[] = [{ id: 'tenant-1', name: 'TestTenant', plan: 'free', status: 'active' }];
  return {
    findOne: jest.fn().mockImplementation((opts: any) => {
      const where = opts?.where;
      return Promise.resolve(tenants.find((t) => t.id === where?.id) || null);
    }),
  };
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepo: ReturnType<typeof makeMockProjectRepo>;
  let tenantRepo: ReturnType<typeof makeMockTenantRepo>;

  beforeEach(() => {
    projectRepo = makeMockProjectRepo();
    tenantRepo = makeMockTenantRepo();
    service = new ProjectsService(projectRepo as any, tenantRepo as any);
  });

  describe('create', () => {
    it('creates a project with valid tenant', async () => {
      const result = await service.create('MyProject', 'tenant-1', 'christian', 'user-1');
      expect(result.name).toBe('MyProject');
      expect(result.vertical).toBe('christian');
      expect(result.ownerId).toBe('user-1');
      expect(result.status).toBe('active');
    });

    it('sets ownerId to tenantId when ownerId not provided', async () => {
      const result = await service.create('Fallback', 'tenant-1');
      expect(result.ownerId).toBe('tenant-1');
    });

    it('throws NotFoundException when tenant not found', async () => {
      await expect(service.create('Bad', 'nonexistent')).rejects.toThrow('Tenant no encontrado');
    });
  });

  describe('findAll', () => {
    it('returns projects for a specific tenant', async () => {
      await service.create('P1', 'tenant-1', 'christian', 'u1');
      await service.create('P2', 'tenant-1', 'automotive', 'u1');
      const results = await service.findAll('tenant-1');
      expect(results).toHaveLength(2);
    });

    it('returns empty for unknown tenant', async () => {
      await service.create('P1', 'tenant-1', undefined, 'u1');
      const results = await service.findAll('tenant-2');
      expect(results).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('returns project when found in tenant', async () => {
      const created = await service.create('FindMe', 'tenant-1', undefined, 'u1');
      const found = await service.findOne(created.id, 'tenant-1');
      expect(found.name).toBe('FindMe');
    });

    it('throws NotFoundException when project not in tenant', async () => {
      const created = await service.create('Other', 'tenant-1', undefined, 'u1');
      await expect(service.findOne(created.id, 'tenant-2')).rejects.toThrow('Proyecto no encontrado');
    });
  });
});
