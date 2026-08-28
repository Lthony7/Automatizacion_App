/*
 * AI Provider - Content Automation Platform FASE 4
 * Interface for AI service providers (Gemini, Groq, OpenAI, etc.)
 * Core depends only on this interface, not on SDKs directly
*/

export interface AIProvider {
  /**
   * Generate text using the AI provider
   * @param prompt The prompt to send to the AI
   * @param variables Variables to substitute in the prompt
   * @param options Additional options (temperature, max tokens, etc.)
   * @returns The generated text, token usage, and cost
  */
  generateText(
    prompt: string,
    variables?: Record<string, string>,
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<{ text: string; tokens: number; cost: number; usage?: any }>;

  /**
   * Generate content using a prompt template
   * @param templateName Name of the prompt template
   * @param variables Variables to substitute
   * @param options Additional options
   * @returns Generated content
  */
  generateFromTemplate(
    templateName: string,
    variables?: Record<string, string>,
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<{ text: string; tokens: number; cost: number; usage?: any }>;

  /**
   * Get the provider name
  */
  getProviderName(): string;

  /**
   * Get the default model name
  */
  getDefaultModel(): string;

  /**
   * Check if the provider is available/healthy
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider metadata for registration
   */
  getMetadata(): {
    provider: string;
    model: string;
    defaultTokens: number;
    estimatedCostPerCall: number;
    supportsStreaming: boolean;
  };
}