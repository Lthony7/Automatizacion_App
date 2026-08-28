/*
 * Permissions Service - Content Automation Platform FASE 2
 * Granular permission code management
*/
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
  ) {}

  async findAll(tenantId: string) {
    return this.permRepo.find({ where: { tenant: { id: tenantId } } });
  }

  async findByCode(code: string, tenantId: string) {
    return this.permRepo.findOne({ where: { code, tenant: { id: tenantId } } });
  }

  async create(code: string, name: string, tenantId: string) {
    // Check if permission already exists in tenant
    const existing = await this.permRepo.findOne({ where: { code, tenant: { id: tenantId } } });
    if (existing) {
      throw new Error('El permiso ya existe en este tenant');
    }

    const perm = this.permRepo.create({
      code,
      name,
      tenant: { id: tenantId } as any,
    });

    return this.permRepo.save(perm);
  }
}