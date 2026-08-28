/*
 * Roles Module - Content Automation Platform FASE 2
 * RBAC role management with permission assignments
 * Roles: OWNER, ADMIN, EDITOR, REVIEWER, VIEWER
 * Permissions granular control per tenant
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';

import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}