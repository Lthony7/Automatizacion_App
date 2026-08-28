/*
 * App Module - Content Automation Platform API
 * FASE 2: Authentication, RBAC, Tenants, Users, Projects, API Keys
 * Multi-tenant isolation with JWT and role-based access control
 * Structured logging integration
 * Health check endpoints via Terminus
*/

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthCheckService, HttpHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Tenant } from './entities/tenant.entity';
import { Project } from './entities/project.entity';
import { ApiKey } from './entities/api-key.entity';
import { Content } from './entities/content.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.example'],
    }),
    TerminusModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ProjectsModule,
    RolesModule,
    PermissionsModule,
    ApiKeysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}