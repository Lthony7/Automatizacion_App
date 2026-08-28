/*
 * Christian Domain Provider - Content Automation Platform FASE 5
 * Complete implementation of DomainProvider for Christian vertical
 * Core does not depend on this - registered via DomainRegistry
*/

import {
  DomainProvider,
  DomainValidator,
  DomainContentTypeProvider,
  DomainPromptProvider,
  DomainRuleProvider,
  DomainTemplateProvider,
  DomainKnowledgeProvider,
  ContentType,
  ValidationResult,
  Prompt,
} from './domain.interface';
import { DomainRegistry } from './domain.registry';
import { ChristianContentType, CHRISTIAN_CONTENT_TYPES, CHRISTIAN_CONTENT_TYPE_METADATA, getChristianContentTypeMetadata } from './christian-content-types';
import { ChristianValidator } from './christian-validator';
import { ChristianPromptProvider } from './christian-prompt-provider';
import { ChristianRuleProvider } from './christian-rule-provider';
import { ChristianTemplateProvider } from './christian-template-provider';
import { ChristianKnowledgeProvider } from './christian-knowledge-provider';

export class ChristianDomainProvider implements DomainProvider {
  private validator: ChristianValidator;
  private promptProvider: ChristianPromptProvider;
  private ruleProvider: ChristianRuleProvider;
  private templateProvider: ChristianTemplateProvider;
  private knowledgeProvider: ChristianKnowledgeProvider;
  private contentTypeProvider: ChristianContentTypeProvider;

  constructor(registry: DomainRegistry) {
    this.contentTypeProvider = new ChristianContentTypeProvider();
    this.validator = new ChristianValidator();
    this.promptProvider = new ChristianPromptProvider();
    this.ruleProvider = new ChristianRuleProvider();
    this.templateProvider = new ChristianTemplateProvider();
    this.knowledgeProvider = new ChristianKnowledgeProvider();

    // Register this domain in the registry
    registry.register('christian', this);
  }

  getContentTypes(): Promise<ContentType[]> {
    return this.contentTypeProvider.getContentTypes();
  }

  getValidator(): DomainValidator {
    return this.validator;
  }

  getPromptProvider(): DomainPromptProvider {
    return this.promptProvider;
  }

  getRuleProvider(): DomainRuleProvider {
    return this.ruleProvider;
  }

  getTemplateProvider(): DomainTemplateProvider {
    return this.templateProvider;
  }

  getKnowledgeProvider(): DomainKnowledgeProvider {
    return this.knowledgeProvider;
  }
}

class ChristianContentTypeProvider implements DomainContentTypeProvider {
  async getContentTypes(): Promise<ContentType[]> {
    return CHRISTIAN_CONTENT_TYPES.map(type => ({
      id: type,
      name: type,
      displayName: CHRISTIAN_CONTENT_TYPE_METADATA[type].displayName,
      description: CHRISTIAN_CONTENT_TYPE_METADATA[type].description,
      vertical: 'christian',
    }));
  }

  isValidType(type: string): boolean {
    return CHRISTIAN_CONTENT_TYPES.includes(type as ChristianContentType);
  }

  getTypeMetadata(type: string): any {
    const metadata = getChristianContentTypeMetadata(type as ChristianContentType);
    return metadata || null;
  }
}