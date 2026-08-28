/*
 * Roles Controller - Content Automation Platform FASE 2
 * RBAC role management with permission assignments
 * Roles: OWNER, ADMIN, EDITOR, REVIEWER, VIEWER
*/

import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: any) {
    return this.rolesService.findAll(req.tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: { name: 'OWNER' | 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER'; description?: string }, @Request() req: any) {
    return this.rolesService.create(req.tenantId, body.name, body.description);
  }

  @Post(':id/permissions')
  @UseGuards(AuthGuard)
  async assignPermissions(@Param('id') roleId: string, @Body() body: { permissionCodes: string[] }, @Request() req: any) {
    return this.rolesService.assignPermissions(roleId, body.permissionCodes, req.tenantId);
  }
}