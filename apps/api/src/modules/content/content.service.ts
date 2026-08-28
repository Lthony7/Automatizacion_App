/*
 * Content Service - Content Automation Platform
 * CRUD + AI generation for content items.
 * Scopes all queries by tenantId from the authenticated request.
 */

import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../../entities/content.entity';
import { AIService } from 'domain-contracts';
import { AI_SERVICE } from '../ai/ai.module';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly repo: Repository<Content>,
    @Inject(AI_SERVICE) private readonly ai: AIService,
  ) {}

  async findAll(tenantId: string): Promise<Content[]> {
    return this.repo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, tenantId: string): Promise<Content> {
    const item = await this.repo.findOne({ where: { id, tenantId } });
    if (!item) throw new NotFoundException(`Content ${id} not found`);
    return item;
  }

  async create(
    tenantId: string,
    dto: {
      title: string;
      contentType: string;
      vertical?: string;
      projectId?: string;
      hook?: string;
      description?: string;
    },
  ): Promise<Content> {
    const content = this.repo.create({
      title: dto.title,
      contentType: dto.contentType as any,
      vertical: (dto.vertical as any) ?? null,
      tenantId,
      projectId: dto.projectId,
      hook: dto.hook,
      description: dto.description,
      status: 'draft',
    });
    return this.repo.save(content);
  }

  async generate(
    tenantId: string,
    dto: {
      contentType: string;
      vertical?: string;
      projectId?: string;
      templateName?: string;
      variables?: Record<string, string>;
      model?: string;
      temperature?: number;
    },
  ): Promise<Content> {
    const templateName = dto.templateName ?? dto.contentType;

    const aiResult = await this.ai.generateText(
      templateName,
      dto.variables,
      {
        model: dto.model,
        temperature: dto.temperature,
        vertical: dto.vertical,
        projectId: dto.projectId,
        tenantId,
        contentType: dto.contentType,
      },
    );

    if (aiResult.error) {
      throw new BadRequestException(`AI generation failed: ${aiResult.error}`);
    }

    const content = this.repo.create({
      title: dto.variables?.title ?? `${dto.contentType} - ${new Date().toISOString().slice(0, 10)}`,
      contentType: dto.contentType,
      vertical: dto.vertical as any,
      tenantId,
      projectId: dto.projectId,
      script: aiResult.text,
      status: 'generated',
      aiProvider: (dto.model?.split('-')[0] as any) ?? null,
      aiModel: dto.model,
      costAi: aiResult.cost,
      metadata: {
        tokens: aiResult.tokens,
        prompt: templateName,
        variables: dto.variables,
      },
    });

    return this.repo.save(content);
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: Content['status'],
  ): Promise<Content> {
    const content = await this.findOne(id, tenantId);
    content.status = status;
    return this.repo.save(content);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const content = await this.findOne(id, tenantId);
    await this.repo.remove(content);
  }

  async getStats(tenantId: string): Promise<Record<string, number>> {
    const items = await this.repo.find({ where: { tenantId }, select: ['status'] });
    const stats: Record<string, number> = {};
    for (const item of items) {
      stats[item.status] = (stats[item.status] ?? 0) + 1;
    }
    return stats;
  }
}
