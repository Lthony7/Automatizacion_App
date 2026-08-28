/*
 * API Keys Module - Content Automation Platform FASE 2
 * API key management: create, rotate, revoke, list, usage tracking
 * Never store API keys in plain text - only hash
 * Permission-based access control
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../../entities/api-key.entity';

import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  providers: [ApiKeysService],
  controllers: [ApiKeysController],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}