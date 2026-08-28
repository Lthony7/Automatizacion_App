/*
 * Automotive Domain Provider - Content Automation Platform FASE 17
 * Compone AutomotiveContentTypes + AutomotiveValidator + Prompts + Rules
 * El Core lo consume vía DomainProvider sin depender de la concreción
 */

import { DomainProvider, DomainValidator, DomainContentTypeProvider, DomainPromptProvider, DomainRuleProvider, DomainTemplateProvider, DomainKnowledgeProvider, ContentType } from './domain.interface'
import { DomainRegistry } from './domain.registry'
import { AutomotiveContentType, AUTOMOTIVE_CONTENT_TYPES, AUTOMOTIVE_CONTENT_TYPE_METADATA, getAutomotiveContentTypeMetadata } from './automotive-content-types'
import { AutomotiveValidator } from './automotive-validator'
import { AutomotivePromptProvider } from './automotive-prompt-provider'
import { AutomotiveRuleProvider } from './automotive-rule-provider'

// Providers stub que reutilizan implementaciones genéricas existentes
class AutomotiveTemplateProvider implements DomainTemplateProvider {
  async getTemplates(contentType: string) {
    return [{ id: `${contentType}-default`, contentType, variant: 'vertical' }]
  }
  async getTemplate(contentType: string, _variant?: string) {
    return { id: `${contentType}-default`, contentType }
  }
  async validateTemplate() { return 'VALID' as const }
}
class AutomotiveKnowledgeProvider implements DomainKnowledgeProvider {
  async search(query: string) { return [{ id: 'k1', title: `Automotive: ${query}`, content: 'Conocimiento automotriz general', type: 'automotive', source: 'manual' }] }
  async getVerse() { return null }
  async getTechnicalTerm(term: string) { return { term, definition: `Definición técnica de ${term}` } }
}

export class AutomotiveDomainProvider implements DomainProvider {
  private contentTypeProvider: AutomotiveContentTypeProvider
  private validator: AutomotiveValidator
  private promptProvider: AutomotivePromptProvider
  private ruleProvider: AutomotiveRuleProvider
  private templateProvider: AutomotiveTemplateProvider
  private knowledgeProvider: AutomotiveKnowledgeProvider

  constructor(registry: DomainRegistry) {
    this.contentTypeProvider = new AutomotiveContentTypeProvider()
    this.validator = new AutomotiveValidator()
    this.promptProvider = new AutomotivePromptProvider()
    this.ruleProvider = new AutomotiveRuleProvider()
    this.templateProvider = new AutomotiveTemplateProvider()
    this.knowledgeProvider = new AutomotiveKnowledgeProvider()
    registry.register('automotive', this)
  }

  getContentTypes(): Promise<ContentType[]> { return this.contentTypeProvider.getContentTypes() }
  getValidator(): DomainValidator { return this.validator }
  getPromptProvider(): DomainPromptProvider { return this.promptProvider }
  getRuleProvider(): DomainRuleProvider { return this.ruleProvider }
  getTemplateProvider(): DomainTemplateProvider { return this.templateProvider }
  getKnowledgeProvider(): DomainKnowledgeProvider { return this.knowledgeProvider }
}

class AutomotiveContentTypeProvider implements DomainContentTypeProvider {
  async getContentTypes(): Promise<ContentType[]> {
    return AUTOMOTIVE_CONTENT_TYPES.map(id => ({
      id, name: id, displayName: AUTOMOTIVE_CONTENT_TYPE_METADATA[id].displayName,
      description: AUTOMOTIVE_CONTENT_TYPE_METADATA[id].description, vertical: 'automotive',
    }))
  }
  isValidType(type: string): boolean { return AUTOMOTIVE_CONTENT_TYPES.includes(type as AutomotiveContentType) }
  getTypeMetadata(type: string) { return getAutomotiveContentTypeMetadata(type as AutomotiveContentType) ?? null }
}
