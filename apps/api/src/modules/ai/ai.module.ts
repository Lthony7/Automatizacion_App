/*
 * AI Service Module - Content Automation Platform
 * FASE 9.6: NestJS DI wrapper for the framework-agnostic AIService.
 *
 * Exposes AIService as an injectable provider so services receive it via
 * constructor injection instead of calling AIService.getInstance() directly.
 * Tests can supply a mock via useValue or useFactory.
 *
 * Usage in any NestJS service:
 *   constructor(@Inject(AI_SERVICE) private readonly ai: AIService) {}
 */

import { Module, Global, Provider } from '@nestjs/common';
import { AIService } from 'domain-contracts';
import { initializeAIProvider } from './ai-provider.factory';

export const AI_SERVICE = 'AI_SERVICE';

const aiServiceProvider: Provider = {
  provide: AI_SERVICE,
  useFactory: () => {
    const result = initializeAIProvider();
    if (result.available) {
      console.log(`[AI] Provider ready: ${result.provider}`);
    }
    return AIService.getInstance();
  },
};

@Global()
@Module({
  providers: [aiServiceProvider],
  exports: [aiServiceProvider],
})
export class AIModule {}
