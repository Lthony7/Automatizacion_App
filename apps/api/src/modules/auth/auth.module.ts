/*
 * Auth Module - Content Automation Platform FASE 2
 * Authentication registration, login, logout, refresh, RBAC
 * Multi-tenant isolation via tenantId in JWT
*/

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AuthController } from './auth.controller';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { Tenant } from '../../entities/tenant.entity';
import { ApiKey } from '../../entities/api-key.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, Tenant, ApiKey]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any },
    }),
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}