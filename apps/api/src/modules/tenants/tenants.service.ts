/*
 * Tenants Service - Content Automation Platform FASE 2
 * Tenant CRUD, plan management, settings
 * Top-level isolation boundary
*/
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/tenant.entity';

/** Roles allowed to create new tenants. Backend-enforced (never trust frontend). */
const TENANT_CREATION_ROLES = new Set(['OWNER', 'SUPER_ADMIN', 'ADMIN']);

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  async findAll(requesterTenantId: string) {
    // Tenant isolation: non-super-admin can only see own tenant
    return this.tenantRepo.find({ where: { id: requesterTenantId } });
  }

  async findOne(id: string, requesterTenantId?: string) {
    if (requesterTenantId && id !== requesterTenantId) {
      throw new NotFoundException('Tenant no encontrado');
    }
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }
    return tenant;
  }

  async create(name: string, plan: 'free' | 'pro' | 'enterprise' = 'free', _requesterTenantId?: string, requesterRole?: string) {
    if (!requesterRole || !TENANT_CREATION_ROLES.has(requesterRole)) {
      throw new ForbiddenException('Solo OWNER/ADMIN puede crear tenants');
    }

    // Check if tenant with same name exists
    const existing = await this.tenantRepo.findOne({ where: { name } });
    if (existing) {
      throw new Error('Ya existe un tenant con este nombre');
    }

    const tenant = this.tenantRepo.create({
      name,
      plan,
      status: 'active',
    });

    return this.tenantRepo.save(tenant);
  }
}