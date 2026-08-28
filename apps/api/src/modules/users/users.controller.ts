/*
 * Users Controller - Content Automation Platform FASE 2
 * User CRUD, profile management, role assignment
 * All operations respect tenant context
*/

import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: any) {
    return this.usersService.findAll(req.tenantId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.usersService.findOne(id, req.tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: { email: string; password: string; name?: string; tenantId: string; role?: string }, @Request() req: any) {
    return this.usersService.create(body, req.tenantId);
  }

  @Post(':id/role')
  @UseGuards(AuthGuard)
  async assignRole(@Param('id') userId: string, @Body() body: { role: string }, @Request() req: any) {
    return this.usersService.assignRole(userId, body.role, req.tenantId);
  }
}