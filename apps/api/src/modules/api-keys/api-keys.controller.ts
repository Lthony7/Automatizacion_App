/*
 * API Keys Controller - Content Automation Platform FASE 2
 * API key management: create, rotate, revoke, list, usage tracking
 * Never store API keys in plain text - only hash
*/

import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: { tenantId: string; permissions: string[]; expiresIn?: number }, @Request() _req: any) {
    return this.apiKeysService.create(body.tenantId, body.permissions, body.expiresIn);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: any) {
    return this.apiKeysService.findAll(req.tenantId);
  }

  @Post(':id/revoke')
  @UseGuards(AuthGuard)
  async revoke(@Param('id') keyId: string, @Request() req: any) {
    return this.apiKeysService.revoke(keyId, req.tenantId);
  }

  @Post(':id/rotate')
  @UseGuards(AuthGuard)
  async rotate(@Param('id') keyId: string, @Request() req: any) {
    return this.apiKeysService.rotate(keyId, req.tenantId);
  }

  @Post(':id/track-usage')
  @UseGuards(AuthGuard)
  async trackUsage(@Param('id') keyId: string, @Request() req: any) {
    return this.apiKeysService.trackUsage(keyId, req.tenantId);
  }
}