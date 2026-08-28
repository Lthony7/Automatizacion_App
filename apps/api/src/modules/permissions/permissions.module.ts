/*
 * Permissions Module - Content Automation Platform FASE 2
 * Granular permission code management
 * Permission codes: "content:create", "content:approve", etc.
 * Denormalized on Role for fast RBAC checks
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../entities/permission.entity';

import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  providers: [PermissionsService],
  controllers: [PermissionsController],
  exports: [PermissionsService],
})
export class PermissionsModule {}