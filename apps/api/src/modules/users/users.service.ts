/*
 * Users Service - Content Automation Platform FASE 2
 * User CRUD, profile management, role assignment
 * Multi-tenant scope: all operations respect tenantId
*/

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { Tenant } from '../../entities/tenant.entity';
import { generateTokens } from '../auth/auth.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  async findAll(tenantId: string) {
    return this.userRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['role'],
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.userRepo.findOne({
      where: { id, tenant: { id: tenantId } },
      relations: ['role'],
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado en este tenant');
    }
    return user;
  }

  async create(body: { email: string; password: string; name?: string; tenantId: string; role?: string }, tenantId: string) {
    // Check if user already exists
    const existing = await this.userRepo.findOne({ where: { email: body.email, tenant: { id: tenantId } } });
    if (existing) {
      throw new Error('User already exists in this tenant');
    }

    // Get tenant
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10);

    // Determine role
    let userRole: Role | null;
    if (body.role) {
      userRole = await this.roleRepo.findOne({ where: { name: body.role, tenant: { id: tenantId } } });
      if (!userRole) {
        userRole = await this.roleRepo.save(
          this.roleRepo.create({
            name: body.role,
            description: `Role: ${body.role}`,
            tenant,
          }),
        );
      }
    } else {
      // Default to VIEWER for new users
      userRole = await this.roleRepo.findOne({ where: { name: 'VIEWER', tenant: { id: tenantId } } });
      if (!userRole) {
        userRole = await this.roleRepo.save(
          this.roleRepo.create({
            name: 'VIEWER',
            description: 'Default viewer role',
            tenant,
          }),
        );
      }
    }
    if (!userRole) {
      throw new Error('No se pudo asignar un rol al usuario');
    }

    // Create user
    const user = this.userRepo.create({
      email: body.email,
      passwordHash,
      name: body.name,
      tenant,
      tenantId,
      role: userRole,
    });

    const savedUser = await this.userRepo.save(user);

    // Generate tokens
    const tokens = generateTokens(savedUser.id, savedUser.tenantId, savedUser.role.name);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role.name,
        tenantId: savedUser.tenantId,
      },
      ...tokens,
    };
  }

  async assignRole(userId: string, roleName: string, tenantId: string) {
    const user = await this.findOne(userId, tenantId);

    let role = await this.roleRepo.findOne({ where: { name: roleName, tenant: { id: tenantId } } });
    if (!role) {
      role = await this.roleRepo.save(
        this.roleRepo.create({
          name: roleName,
          description: `Role: ${roleName}`,
          tenant: { id: tenantId } as any,
        }),
      );
    }

    user.role = role;
    await this.userRepo.save(user);

    return { success: true, user };
  }
}