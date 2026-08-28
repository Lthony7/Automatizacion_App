/*
 * Tenants Controller - Content Automation Platform FASE 2
 * Tenant CRUD, plan management, settings
 * Top-level isolation boundary
*/

import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: any) {
    return this.tenantsService.findAll(req.tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: { name: string; plan?: 'free' | 'pro' | 'enterprise' }, @Request() req: any) {
    return this.tenantsService.create(body.name, body.plan, req.tenantId, req.role);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.tenantsService.findOne(id, req.tenantId);
  }
}