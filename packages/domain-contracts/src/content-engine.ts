export type ContentPipelineStatus = 'GENERATED' | 'VALIDATED' | 'INVALID';

export interface ContentIdea {
  text: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface ContentFields {
  hook: string;
  title: string;
  script: string;
  description: string;
  cta: string;
  hashtags: string[];
  references: string[];
  metadata: Record<string, unknown>;
}

export interface GeneratedContent extends ContentFields {
  id: string;
  tenantId: string;
  projectId?: string;
  domain: string;
  contentType: string;
  campaignId?: string;
  idea: ContentIdea;
  prompt: string;
  generatedAt: Date;
}

export interface ContentGenerationRequest {
  id: string;
  tenantId: string;
  projectId?: string;
  domain: string;
  contentType: string;
  campaignId?: string;
  idea: ContentIdea;
  variables?: Record<string, string>;
}

export interface StructuredContentAI {
  generate(input: {
    prompt: string;
    idea: ContentIdea;
    tenantId: string;
    projectId?: string;
    domain: string;
    contentType: string;
  }): Promise<ContentFields>;
}

/** The Core-facing subset of Domain Engine capabilities used by content generation. */
export interface ContentDomainProvider {
  getContentTypes(): Promise<Array<{ id: string }>>;
  getPromptProvider(): {
    getPrompt(contentType: string, variables: Record<string, string>): Promise<string>;
  };
  getValidator(): {
    validate(content: GeneratedContent): Promise<{
      status: 'VALID' | 'WARNING' | 'INVALID';
      errors: string[];
      warnings: string[];
    }>;
  };
}

export interface DomainProviderResolver {
  getDomain(domain: string): ContentDomainProvider | undefined;
}

export interface ContentPipelineResult {
  content: GeneratedContent;
  status: ContentPipelineStatus;
  validation: {
    status: 'VALID' | 'WARNING' | 'INVALID';
    errors: string[];
    warnings: string[];
  };
}

/**
 * Generic orchestration for Idea -> Content Type -> Prompt -> AI -> Validation.
 * Domain-specific behavior remains behind DomainProvider.
 */
export class ContentEngine {
  constructor(
    private readonly domains: DomainProviderResolver,
    private readonly ai: StructuredContentAI,
  ) {}

  async generate(request: ContentGenerationRequest): Promise<ContentPipelineResult> {
    const domain = this.domains.getDomain(request.domain);
    if (!domain) {
      throw new Error(`Unknown domain: ${request.domain}`);
    }

    const contentTypes = await domain.getContentTypes();
    if (!contentTypes.some((contentType) => contentType.id === request.contentType)) {
      throw new Error(`Unsupported content type "${request.contentType}" for domain "${request.domain}".`);
    }

    const prompt = await domain.getPromptProvider().getPrompt(request.contentType, {
      idea: request.idea.text,
      ...request.variables,
    });
    const fields = await this.ai.generate({
      prompt,
      idea: request.idea,
      tenantId: request.tenantId,
      projectId: request.projectId,
      domain: request.domain,
      contentType: request.contentType,
    });
    const content: GeneratedContent = {
      ...fields,
      id: request.id,
      tenantId: request.tenantId,
      projectId: request.projectId,
      domain: request.domain,
      contentType: request.contentType,
      campaignId: request.campaignId,
      idea: request.idea,
      prompt,
      generatedAt: new Date(),
    };
    const validation = await domain.getValidator().validate(content);

    return {
      content,
      status: validation.status === 'INVALID' ? 'INVALID' : 'VALIDATED',
      validation,
    };
  }
}
