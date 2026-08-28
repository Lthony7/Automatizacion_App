/*
 * AI Provider Factory - Content Automation Platform
 * Initializes the AISingleton with the appropriate provider based on env vars.
 * Supports: GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY
 * Falls back gracefully: first available key wins.
 */

import { AIService, GeminiProvider, OpenAIProvider, GroqProvider, InMemoryPromptProvider } from 'domain-contracts';
import type { AIProvider } from 'domain-contracts';

const PROVIDER_ENV_MAP = [
  { envKey: 'GEMINI_API_KEY', Provider: GeminiProvider, name: 'gemini' },
  { envKey: 'OPENAI_API_KEY', Provider: OpenAIProvider, name: 'openai' },
  { envKey: 'GROQ_API_KEY', Provider: GroqProvider, name: 'groq' },
] as const;

/**
 * Initialize AIService with the first available provider.
 * Priority: AI_PROVIDER env var > first available key.
 */
export function initializeAIProvider(): { provider: string; available: boolean } {
  const ai = AIService.getInstance();
  const preferredProvider = process.env.AI_PROVIDER?.toLowerCase();

  let selectedName = '';
  let selectedProvider: AIProvider | null = null;

  // 1. Try preferred provider first
  if (preferredProvider) {
    const match = PROVIDER_ENV_MAP.find((p) => p.name === preferredProvider);
    if (match) {
      const apiKey = process.env[match.envKey];
      if (apiKey) {
        selectedProvider = new match.Provider(apiKey);
        selectedName = match.name;
      }
    }
  }

  // 2. Fallback to first available
  if (!selectedProvider) {
    for (const { envKey, Provider, name } of PROVIDER_ENV_MAP) {
      const apiKey = process.env[envKey];
      if (apiKey) {
        selectedProvider = new Provider(apiKey);
        selectedName = name;
        break;
      }
    }
  }

  // 3. Wire up
  if (selectedProvider) {
    ai.setProvider(selectedProvider);
    // Initialize in-memory prompt provider (pre-seeded with default templates)
    ai.setPromptProvider(new InMemoryPromptProvider());
    ai.updateConfig({
      provider: selectedName,
      model: selectedProvider.getDefaultModel(),
    });
    console.log(`[AI] Provider initialized: ${selectedName} (${selectedProvider.getDefaultModel()})`);
    return { provider: selectedName, available: true };
  }

  console.warn('[AI] No AI provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY.');
  return { provider: 'none', available: false };
}
