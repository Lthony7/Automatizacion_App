/*
 * Auth Service - Content Automation Platform FASE 2
 * Authentication, registration, login, logout, password hashing, JWT refresh
 * Multi-tenant aware: all operations respect tenant context
*/

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { decode } from 'jsonwebtoken';
import { createHash } from 'crypto';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { Tenant } from '../../entities/tenant.entity';
import { generateTokens, verifyPassword } from './auth.utils';
import { getTokenBlacklist } from './token-blacklist';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    tenantId: string,
    name?: string,
  ) {
    // Check if user already exists in tenant
    const existing = await this.userRepo.findOne({ where: { email, tenant: { id: tenantId } } });
    if (existing) {
      throw new Error('User already exists in this tenant');
    }

    // Get default role (VIEWER for new users, or OWNER if creating first user)
    let defaultRole: Role;
    const tenantRoles = await this.roleRepo.find({ where: { tenant: { id: tenantId } } });
    if (tenantRoles.length === 0) {
      // Create default roles for new tenant
      const ownerRole = this.roleRepo.create({
        name: 'OWNER',
        description: 'Tenant owner with full access',
        tenant: { id: tenantId } as Tenant,
      });
      defaultRole = await this.roleRepo.save(ownerRole);

      // Create default permissions for OWNER
      const adminPerms = ['content:create', 'content:approve', 'content:manage', 'user:manage', 'tenant:manage', 'api:manage'];
      for (const permCode of adminPerms) {
        await this.permRepo.save(
          this.permRepo.create({
            code: permCode,
            name: permCode.replace(/:/, ': '),
            tenant: { id: tenantId } as Tenant,
          }),
        );
      }

      // Create admin role and assign to owner
      const adminRole = this.roleRepo.create({
        name: 'ADMIN',
        description: 'Project administrator',
        tenant: { id: tenantId } as Tenant,
      });
      await this.roleRepo.save(adminRole);

      // Assign owner role to creator
      defaultRole = adminRole;
    } else {
      defaultRole = tenantRoles.find(r => r.name === 'VIEWER') || tenantRoles[0];
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepo.create({
      email,
      passwordHash,
      name,
      tenant: { id: tenantId } as Tenant,
      tenantId,
      role: defaultRole,
    });

    const savedUser = await this.userRepo.save(user);

    // Assign the default role to user
    await this.roleRepo
      .save(
        this.roleRepo.create({
          name: defaultRole.name,
          description: defaultRole.description,
          tenant: { id: tenantId } as Tenant,
          tenantId,
          permissions: defaultRole.permissions,
        }),
      );

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

  async login(email: string, password: string, tenantId: string) {
    const user = await this.userRepo.findOne({
      where: { email, tenant: { id: tenantId } },
      relations: ['role'],
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = generateTokens(user.id, user.tenantId, user.role.name);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        tenantId: user.tenantId,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret || refreshSecret.includes('change-this')) {
      throw new UnauthorizedException('Refresh misconfiguration');
    }
    const payload = this.jwtService.verify(token, {
      secret: refreshSecret,
    });

    if (!payload?.sub || !payload?.tenantId) {
      throw new UnauthorizedException('Token de refresco inválido');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, tenant: { id: payload.tenantId } },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return generateTokens(user.id, user.tenantId, user.role.name);
  }

  async logout(token: string, userId: string, _tenantId: string) {
    // H-01: revoke the presented access token until its natural expiry.
    void userId;
    const decoded = decode(token) as { exp?: number } | null;
    const remainingSeconds = decoded?.exp
      ? Math.max(0, Math.floor(decoded.exp - Date.now() / 1000))
      : 0;
    if (remainingSeconds > 0 || decoded?.exp) {
      const fingerprint = createHash('sha256').update(token).digest('hex');
      await getTokenBlacklist().revoke(fingerprint, remainingSeconds);
    }
    return { success: true };
  }
}