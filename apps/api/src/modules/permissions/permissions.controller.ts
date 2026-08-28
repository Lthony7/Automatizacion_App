/*
 * Permissions Controller - Content Automation Platform FASE 2
 * Granular permission code management
*/

import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: any) {
    return this.permissionsService.findAll(req.tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: { code: string; name: string; tenantId: string }) {
    return this.permissionsService.create(body.code, body.name, body.tenantId);
  }

  @Get('by-code/:code')
  @UseGuards(AuthGuard)
  async findByCode(@Param('code') code: string, @Request() req: any) {
    return this.permissionsService.findByCode(code, req.tenantId);
  }
}