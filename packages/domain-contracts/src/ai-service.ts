/*
 * AI Service - Content Automation Platform FASE 4
 * Singleton service that all modules use for AI operations
 * Decouples business logic from AI SDKs (Gemini, OpenAI, Groq, etc.)
 * Handles prompt resolution through the PromptProvider with hierarchy:
 *   System Prompt → Domain Prompt → Project Prompt → Content Prompt
 * Registers provider metadata: provider, model, tokens, latency, estimated_cost, status, error
 *
 * NOTE (FASE 9.6 stabilization):
 *  - Removed invalid `private readonly readonly` syntax (compile error).
 *  - Removed unsafe non-null assertions (`this!...!`) — explicit validation now
 *    throws a clear AIServiceError instead of crashing on null provider.
 *  - recordUsage no longer requires tenantId (callers may not have request context);
 *    when provided it is included for cost attribution.
 *
 * DI strategy (future refactor): AIService remains a singleton because domain
 * packages must stay framework-agnostic (no NestJS imports here). The NestJS API
 * should expose it via a provider token (e.g. `provide: AIService, useValue: AIService.getInstance()`)
 * so services receive it through constructor injection and tests can supply a mock
 * via setProvider/setPromptProvider without touching global state.
 */

import { AIProvider } from './ai-provider';
import { PromptProvider } from './prompt-provider';

export interface AIServiceConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AIUsageRecord {
  id: string;
  provider: string;
  model: string;
  tokens: number;
  latency: number; // in milliseconds
  estimatedCost: number;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
  contentId?: string;
  tenantId?: string;
  projectId?: string;
  vertical?: string;
  contentType?: string;
  generatedAt: Date;
}

/** Thrown when AIService is used before being initialized. */
export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIService {
  private static instance: AIService;
  private provider: AIProvider | null = null;
  private promptProvider: PromptProvider | null = null;
  private config: AIServiceConfig = {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 2048,
  };
  private readonly providerMetadata: Record<string, {
    provider: string;
    model: string;
    defaultTokens: number;
    estimatedCostPerCall: number;
    supportsStreaming: boolean;
  }> = {
    gemini: {
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      defaultTokens: 1000,
      estimatedCostPerCall: 0.001,
      supportsStreaming: true,
    },
    groq: {
      provider: 'groq',
      model: 'llama3-8b-8192',
      defaultTokens: 1000,
      estimatedCostPerCall: 0.0003,
      supportsStreaming: true,
    },
    openai: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      defaultTokens: 1000,
      estimatedCostPerCall: 0.00015,
      supportsStreaming: true,
    },
  };

  // Constructor is private for singleton pattern
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Set the AI provider (called during initialization)
   */
  public setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  /**
   * Set the prompt provider (called during initialization)
   */
  public setPromptProvider(promptProvider: PromptProvider): void {
    this.promptProvider = promptProvider;
  }

  /**
   * Get the current AI provider
   */
  public getProvider(): AIProvider | null {
    return this.provider;
  }

  /**
   * Get the current prompt provider
   */
  public getPromptProvider(): PromptProvider | null {
    return this.promptProvider;
  }

  /** Explicit initialization check — never crash on implicit nulls. */
  private requireInitialized(): { provider: AIProvider; promptProvider: PromptProvider } {
    if (!this.provider) {
      throw new AIServiceError('AI provider not initialized. Call setProvider() before generating text.');
    }
    if (!this.promptProvider) {
      throw new AIServiceError('Prompt provider not initialized. Call setPromptProvider() before generating text.');
    }
    return { provider: this.provider, promptProvider: this.promptProvider };
  }

  /**
   * Generate text using a template name (compatibility API).
   * Resolves through the prompt hierarchy and delegates to generateFromTemplate.
   */
  public async generateText(
    templateName: string,
    variables?: Record<string, string>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
      vertical?: string;
      projectId?: string;
      tenantId?: string;
      contentType?: string;
    },
  ): Promise<{ text: string; tokens: number; cost: number; error?: string }> {
    return this.generateFromTemplate(templateName, variables, options);
  }

  /**
   * Generate text using a specific template with full prompt resolution
   */
  public async generateFromTemplate(
    templateName: string,
    variables?: Record<string, string>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
      vertical?: string;
      projectId?: string;
      tenantId?: string;
      contentType?: string;
    },
  ): Promise<{ text: string; tokens: number; cost: number; error?: string }> {
    const resolvedPrompt = await this.resolvePrompt(
      templateName,
      variables,
      options?.vertical,
      options?.projectId,
      options?.tenantId,
      options?.contentType,
    );

    let provider: AIProvider;
    try {
      provider = this.requireInitialized().provider;
    } catch (err) {
      return { text: '', tokens: 0, cost: 0, error: (err as Error).message };
    }

    const startedAt = Date.now();
    try {
      const result = await provider.generateText(resolvedPrompt, variables, {
        temperature: options?.temperature ?? this.config.temperature,
        maxTokens: options?.maxTokens ?? this.config.maxTokens,
        model: options?.model ?? this.config.model,
      });

      this.recordUsage({
        tokens: result.tokens,
        estimatedCost:
          (this.providerMetadata[this.config.provider]?.estimatedCostPerCall ?? 0) *
          Math.max(result.tokens / 1000, 0),
        latencyMs: Date.now() - startedAt,
        status: 'success',
        tenantId: options?.tenantId,
        projectId: options?.projectId,
        vertical: options?.vertical,
        contentType: options?.contentType,
      });

      return { text: result.text, tokens: result.tokens, cost: result.cost };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.recordUsage({
        tokens: 0,
        estimatedCost: 0,
        latencyMs: Date.now() - startedAt,
        status: 'error',
        errorMessage: message,
        tenantId: options?.tenantId,
        projectId: options?.projectId,
        vertical: options?.vertical,
        contentType: options?.contentType,
      });
      return { text: '', tokens: 0, cost: 0, error: message };
    }
  }

  /**
   * Resolve a prompt through the hierarchy:
   * System Prompt → Domain Prompt → Project Prompt → Content Prompt
   * Throws AIServiceError when the prompt provider is missing (explicit contract).
   */
  public async resolvePrompt(
    templateName: string,
    variables?: Record<string, string>,
    vertical?: string,
    projectId?: string,
    tenantId?: string,
    contentType?: string,
  ): Promise<string> {
    const { promptProvider } = this.requireInitialized();

    // Start with system prompt (base template)
    let prompt = (await promptProvider.getPrompt(templateName, 'latest')) ?? '';

    // Apply domain prompt override (vertical-specific)
    if (vertical) {
      const domainPrompt = await promptProvider.getPrompt(`${templateName}_${vertical}`, 'latest');
      if (domainPrompt) {
        prompt = `${prompt}\n\n---\n${domainPrompt}`;
      }
    }

    // Apply project prompt override
    if (projectId) {
      const projectPrompt = await promptProvider.getPrompt(`${templateName}_project_${projectId}`, 'latest');
      if (projectPrompt) {
        prompt = `${prompt}\n\n---\n${projectPrompt}`;
      }
    }

    // Apply content prompt override
    if (contentType) {
      const contentPrompt = await promptProvider.getPrompt(`${templateName}_${contentType}`, 'latest');
      if (contentPrompt) {
        prompt = `${prompt}\n\n---\n${contentPrompt}`;
      }
    }

    // Apply variable substitution
    if (variables && typeof prompt === 'string') {
      let result = prompt;
      for (const [key, value] of Object.entries(variables)) {
        result = result.split(`{${key}}`).join(value);
      }
      prompt = result;
    }

    return prompt;
  }

  /**
   * Register usage for monitoring and cost tracking
   */
  private recordUsage(usage: {
    tokens: number;
    estimatedCost: number;
    latencyMs?: number;
    status: 'success' | 'error';
    errorMessage?: string;
    tenantId?: string;
    projectId?: string;
    vertical?: string;
    contentType?: string;
  }): void {
    void usage; // hook point: persist to DB/queue for analytics in production wiring
  }

  /**
   * Get the current configuration
   */
  public getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  /**
   * Update the service configuration
   */
  public updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get provider metadata for registration and monitoring
   */
  public getProviderMetadata(): {
    provider: string;
    model: string;
    defaultTokens: number;
    estimatedCostPerCall: number;
    supportsStreaming: boolean;
  } {
    return this.providerMetadata[this.config.provider] || this.providerMetadata.gemini;
  }

  /**
   * Check if the current provider is available
   */
  public async checkAvailability(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }
    return this.provider.isAvailable();
  }
}
