/*
 * Projects Module - Content Automation Platform FASE 2
 * Project CRUD, vertical assignment, tenant scoping
 * Projects belong to a Tenant, have a vertical (christian, automotive, etc.)
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../../entities/project.entity';
import { Tenant } from '../../entities/tenant.entity';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Tenant])],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}