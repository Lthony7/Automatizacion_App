/*
 * Projects Controller - Content Automation Platform FASE 2
 * Project CRUD, vertical assignment, tenant scoping
*/

import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: any) {
    return this.projectsService.findAll(req.tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() body: { name: string; vertical?: 'christian' | 'automotive' | 'fitness' },
    @Request() req: any,
  ) {
    return this.projectsService.create(body.name, req.tenantId, body.vertical, req.userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.findOne(id, req.tenantId);
  }
}