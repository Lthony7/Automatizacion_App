/*
 * Domain Contracts - Content Automation Platform FASE 1
 * Seven conceptual interfaces for vertical plug-in architecture
 * Core never depends on these concretions - only on the interface contracts
*/

// ---------------------------------------------------------------------------
// DomainProvider - Root interface combining all domain behaviors
// ---------------------------------------------------------------------------
export interface DomainProvider {
  getContentTypes(): Promise<ContentType[]>;
  getValidator(): DomainValidator;
  getPromptProvider(): DomainPromptProvider;
  getRuleProvider(): DomainRuleProvider;
  getTemplateProvider(): DomainTemplateProvider;
  getKnowledgeProvider(): DomainKnowledgeProvider;
}

// ---------------------------------------------------------------------------
// DomainValidator - Validate content against domain rules
// ---------------------------------------------------------------------------
export interface DomainValidator {
  validate(content: any): Promise<ValidationResult>;
  getErrors(content: any): Promise<string[]>;
  getWarnings(content: any): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// DomainContentTypeProvider - Define valid content types per vertical
// ---------------------------------------------------------------------------
export interface DomainContentTypeProvider {
  getContentTypes(): Promise<ContentType[]>;
  isValidType(type: string): boolean;
  getTypeMetadata(type: string): any;
}

// ---------------------------------------------------------------------------
// DomainPromptProvider - Versioned prompts associated with tenant/project/vertical
// ---------------------------------------------------------------------------
export interface DomainPromptProvider {
  getPrompts(contentType: string, version?: string): Promise<Prompt[]>;
  getPrompt(contentType: string, variables: Record<string, string>): Promise<string>;
  listVersions(contentType: string): Promise<{version: string; releasedAt: Date}[]>;
}

// ---------------------------------------------------------------------------
// DomainRuleProvider - Workflow and business rules per vertical
// ---------------------------------------------------------------------------
export interface DomainRuleProvider {
  canTransition(content: any, from: string, to: string, user: any): Promise<boolean>;
  getApprovalRequirements(content: any): Promise<{role: string; minWeight: number}[]>;
  getCostFactors(content: any): Promise<{factor: string; baseCost: number}[]>;
  getPublicationRequirements(content: any): Promise<{type: string; required: boolean}[]>;
}

// ---------------------------------------------------------------------------
// DomainTemplateProvider - Template management per vertical
// ---------------------------------------------------------------------------
export interface DomainTemplateProvider {
  getTemplates(contentType: string): Promise<any[]>;
  getTemplate(contentType: string, variant?: string): Promise<any>;
  validateTemplate(template: any): Promise<'VALID' | 'INVALID'>;
}

// ---------------------------------------------------------------------------
// DomainKnowledgeProvider - Domain-specific knowledge base
// ---------------------------------------------------------------------------
export interface DomainKnowledgeProvider {
  search(query: string, type?: string): Promise<any[]>;
  getVerse(reference: string): Promise<any>;
  getTechnicalTerm(term: string): Promise<any>;
}

// ---------------------------------------------------------------------------
// Shared Types used by domain contracts
// ---------------------------------------------------------------------------

export interface ContentType {
  id: string;
  name: string;
  displayName: string;
  description: string;
  vertical: string;
}

export interface ValidationResult {
  status: 'VALID' | 'WARNING' | 'INVALID';
  errors: string[];
  warnings: string[];
}

export interface Prompt {
  id: string;
  contentType: string;
  version: string;
  title: string;
  template: string;
  variables: string[];
  isDefault: boolean;
  tenantId?: string;
  projectId?: string;
}

export interface TypeMetadata {
  name: string;
  description: string;
  requiredFields: string[];
  defaultValues: Record<string, any>;
}

export interface VersionInfo {
  version: string;
  releasedAt: Date;
  notes?: string;
}

export interface ApprovalRequirement {
  role: string;
  minWeight: number; // 0.0 to 1.0
}

export interface CostFactor {
  factor: string;
  baseCost: number;
}

export interface PublicationRequirement {
  type: string;
  required: boolean;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: string;
  source: string;
}