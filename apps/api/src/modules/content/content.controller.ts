/*
 * Content Controller - Content Automation Platform
 * REST endpoints for content CRUD + AI generation.
 */

import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ContentService } from './content.service';
import type { Content } from '../../entities/content.entity';

@UseGuards(AuthGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly svc: ContentService) {}

  @Get()
  findAll(@Req() req: any): Promise<Content[]> {
    return this.svc.findAll(req.tenantId);
  }

  @Get('stats')
  getStats(@Req() req: any): Promise<Record<string, number>> {
    return this.svc.getStats(req.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any): Promise<Content> {
    return this.svc.findOne(id, req.tenantId);
  }

  @Post()
  create(
    @Body() body: {
      title: string;
      contentType: string;
      vertical?: string;
      projectId?: string;
      hook?: string;
      description?: string;
    },
    @Req() req: any,
  ): Promise<Content> {
    return this.svc.create(req.tenantId, body);
  }

  @Post('generate')
  generate(
    @Body() body: {
      contentType: string;
      vertical?: string;
      projectId?: string;
      templateName?: string;
      variables?: Record<string, string>;
      model?: string;
      temperature?: number;
    },
    @Req() req: any,
  ): Promise<Content> {
    return this.svc.generate(req.tenantId, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: Content['status'],
    @Req() req: any,
  ): Promise<Content> {
    return this.svc.updateStatus(id, req.tenantId, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.svc.remove(id, req.tenantId);
  }
}
