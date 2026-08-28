/*
 * Projects Service - Content Automation Platform FASE 2
 * Project CRUD, vertical assignment, tenant scoping
*/
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  async findAll(tenantId: string) {
    return this.projectRepo.find({
      where: { tenant: { id: tenantId } },
    });
  }

  async findOne(id: string, tenantId: string) {
    const project = await this.projectRepo.findOne({
      where: { id, tenant: { id: tenantId } },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado en este tenant');
    }
    return project;
  }

  async create(name: string, tenantId: string, vertical?: 'christian' | 'automotive' | 'fitness', ownerId?: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const project = this.projectRepo.create({
      name,
      vertical,
      tenant,
      tenantId,
      ownerId: ownerId ?? tenantId, // fallback keeps NOT NULL constraint satisfied; callers should pass req.userId
      status: 'active',
    });

    return this.projectRepo.save(project);
  }
}