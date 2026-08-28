/*
 * Roles Service - Content Automation Platform FASE 2
 * RBAC role management with permission assignments
 * Roles: OWNER, ADMIN, EDITOR, REVIEWER, VIEWER
*/

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
  ) {}

  async findAll(tenantId: string) {
    return this.roleRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['permissions'],
    });
  }

  async create(tenantId: string, name: 'OWNER' | 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER', description?: string) {
    // Check if role already exists in tenant
    const existing = await this.roleRepo.findOne({ where: { name, tenant: { id: tenantId } } });
    if (existing) {
      throw new Error('El rol ya existe en este tenant');
    }

    // Create default permissions for each role
    const defaultPerms: { [key: string]: string[] } = {
      OWNER: ['content:create', 'content:approve', 'content:manage', 'user:manage', 'tenant:manage', 'api:manage'],
      ADMIN: ['content:create', 'content:approve', 'content:manage'],
      EDITOR: ['content:create', 'content:edit'],
      REVIEWER: ['content:approve'],
      VIEWER: [],
    };

    const permCodes = defaultPerms[name] || [];
    const permissions = await Promise.all(
      permCodes.map(code => this.permRepo.findOne({ where: { code, tenant: { id: tenantId } } }))
    );

    // Create any missing permissions
    const createdPerms = await Promise.all(
      permCodes.map(async (code) => {
        let perm = permissions.find(p => p?.code === code);
        if (!perm) {
          perm = this.permRepo.create({
            code,
            name: code.replace(/:/, ': '),
            tenant: { id: tenantId } as any,
          });
          await this.permRepo.save(perm);
        }
        return perm;
      }),
    );

    const role = this.roleRepo.create({
      name,
      description,
      tenant: { id: tenantId } as any,
      permissions: createdPerms,
    });

    return this.roleRepo.save(role);
  }

  async assignPermissions(roleId: string, permissionCodes: string[], tenantId: string) {
    const role = await this.roleRepo.findOne({ where: { id: roleId, tenant: { id: tenantId } } });
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Get permissions scoped to this tenant
    if (permissionCodes.length === 0) {
      role.permissions = [];
    } else {
      const perms = await this.permRepo.find({
        where: { code: In(permissionCodes), tenant: { id: tenantId } },
      });
      const foundCodes = new Set(perms.map((p) => p.code));
      const missing = permissionCodes.filter((c) => !foundCodes.has(c));
      if (missing.length > 0) {
        throw new NotFoundException(`Permisos no encontrados en este tenant: ${missing.join(', ')}`);
      }
      role.permissions = perms;
    }
    await this.roleRepo.save(role);

    return { success: true, role };
  }
}