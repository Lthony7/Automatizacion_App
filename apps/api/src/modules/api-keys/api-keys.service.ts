/*
 * API Keys Service - Content Automation Platform FASE 2
 * API key management: create, rotate, revoke, list, usage tracking
 * Never store API keys in plain text - only hash
*/
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ApiKey } from '../../entities/api-key.entity';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async create(tenantId: string, permissions: string[], expiresIn?: number) {
    // Check if there's already an active key for this tenant
    const existing = await this.apiKeyRepo.findOne({ where: { tenant: { id: tenantId }, status: 'active' } });
    if (existing) {
      throw new Error('Ya existe una API key activa para este tenant');
    }

    // CSPRNG: 32 bytes entropy, base64url
    const rawKey = `sk_${crypto.randomBytes(32).toString('base64url')}`;
    const hash = await bcrypt.hash(rawKey, 12);
    const prefix = rawKey.slice(0, 12);

    const apiKey = this.apiKeyRepo.create({
      hash,
      prefix,
      permissions,
      tenant: { id: tenantId } as any,
      status: 'active',
    });

    const savedKey = await this.apiKeyRepo.save(apiKey);

    return {
      success: true,
      data: {
        rawKey, // returned once, never logged
        prefix: savedKey.prefix,
        permissions: savedKey.permissions,
        ...(expiresIn !== undefined ? { expiresIn } : {}),
      },
    };
  }

  async findAll(tenantId: string) {
    return this.apiKeyRepo.find({ where: { tenant: { id: tenantId } } });
  }

  async revoke(keyId: string, tenantId: string) {
    const key = await this.apiKeyRepo.findOne({ where: { id: keyId, tenant: { id: tenantId } } });
    if (!key) {
      throw new NotFoundException('API key no encontrada');
    }

    key.status = 'revoked';
    key.revokedAt = new Date();
    await this.apiKeyRepo.save(key);

    return { success: true };
  }

  async rotate(keyId: string, tenantId: string) {
    const key = await this.apiKeyRepo.findOne({ where: { id: keyId, tenant: { id: tenantId } } });
    if (!key) {
      throw new NotFoundException('API key no encontrada');
    }

    // Revoke old key
    key.status = 'revoked';
    key.revokedAt = new Date();
    await this.apiKeyRepo.save(key);

    // Create new key
    const newKey = await this.create(tenantId, key.permissions);

    return {
      success: true,
      data: {
        oldPrefix: key.prefix,
        newKey: newKey.data,
      },
    };
  }

  async trackUsage(keyId: string, tenantId: string) {
    const key = await this.apiKeyRepo.findOne({ where: { id: keyId, tenant: { id: tenantId } } });
    if (!key) {
      throw new NotFoundException('API key no encontrada');
    }

    key.lastUsedAt = new Date();
    await this.apiKeyRepo.save(key);

    return { success: true, lastUsedAt: key.lastUsedAt };
  }
}