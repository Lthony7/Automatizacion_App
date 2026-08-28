/*
 * AI Engine Tests - Content Automation Platform FASE 4
 * Tests for AIService, AIProvider, PromptProvider, GeminiProvider
*/

import { AIService } from '../../src/ai-service';
import { GeminiProvider } from '../../src/providers/gemini-provider';
import { AIServiceConfig, AIUsageRecord } from '../../src/ai-service';
import type { AIProvider } from '../../src/ai-provider';

describe('AI Engine FASE 4', () => {
  let aiService: AIService;
  let geminiProvider: GeminiProvider;

  beforeEach(() => {
    // Create Gemini provider with a dummy API key
    geminiProvider = new GeminiProvider('dummy-api-key');
    aiService = AIService.getInstance();
    // Set the provider and prompt provider
    aiService.setProvider(geminiProvider);
  });

  describe('AIService singleton', () => {
    test('should return the same instance', () => {
      const instance1 = AIService.getInstance();
      const instance2 = AIService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should set and get provider', () => {
      aiService.setProvider(geminiProvider);
      expect(aiService.getProvider()).toBe(geminiProvider);
    });

    test('should set and get prompt provider', () => {
      const promptProvider = {
        getPrompt: () => Promise.resolve('test prompt'),
        listVersions: () => Promise.resolve(['1.0.0']),
        getPromptMetadata: () => Promise.resolve({ version: '1.0.0', description: 'test', variables: [], vertical: undefined, contentType: undefined, projectOverride: false, tenantOverride: false, systemPrompt: undefined }),
        resolvePrompt: () => Promise.resolve('resolved prompt'),
        listTemplates: () => Promise.resolve(['template1']),
        savePromptVersion: () => Promise.resolve(),
      };
      aiService.setPromptProvider(promptProvider as any);
      expect(aiService.getPromptProvider()).toBeDefined();
    });
  });

  describe('AIService configuration', () => {
    test('should have default configuration', () => {
      const config = aiService.getConfig();
      expect(config).toHaveProperty('provider');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('maxTokens');
    });

    test('should update configuration', () => {
      aiService.updateConfig({ temperature: 0.5, maxTokens: 1024 });
      const config = aiService.getConfig();
      expect(config.temperature).toBe(0.5);
      expect(config.maxTokens).toBe(1024);
    });
  });

  describe('AIService prompt resolution', () => {
    test('should resolve prompt with hierarchy', async () => {
      // Set up a mock prompt provider that returns different prompts at different hierarchy levels
      const mockPromptProvider = {
        getPrompt: async (name: string, version?: string) => {
          if (name === 'test_prompt_latest') return 'base system prompt';
          if (name === 'test_prompt_christian_latest') return 'christian domain override';
          if (name === 'test_prompt_project_123_latest') return 'project override';
          if (name === 'test_prompt_verse_latest') return 'verse content type override';
          return null;
        },
        listVersions: async (name: string) => ['1.0.0', '2.0.0'],
        getPromptMetadata: async (name: string) => ({
          version: '2.0.0',
          description: 'test metadata',
          variables: ['{theme}', '{duration}'],
          vertical: 'christian',
          contentType: 'prayer',
          projectOverride: true,
          tenantOverride: false,
          systemPrompt: 'base system prompt',
        }),
        resolvePrompt: async (templateName: string, variables?: Record<string, string>, vertical?: string, projectId?: string, tenantId?: string, contentType?: string) => {
          // Start with system prompt
          let prompt = 'base system prompt';

          // Apply domain prompt override (vertical-specific)
          if (vertical === 'christian') {
            prompt = `${prompt}\n\n---\nchristian domain override`;
          }

          // Apply project prompt override
          if (projectId === 'proj_123') {
            prompt = `${prompt}\n\n---\nproject override`;
          }

          // Apply content prompt override
          if (contentType === 'prayer') {
            prompt = `${prompt}\n\n---\nprayer content type override`;
          }

          // Apply variable substitution
          if (variables) {
            let result = prompt;
            for (const [key, value] of Object.entries(variables)) {
              result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            }
            prompt = result;
          }

          return prompt;
        },
        listTemplates: async () => ['test_prompt', 'test_prompt_christian', 'test_prompt_project_123', 'test_prompt_verse'],
        savePromptVersion: async () => {},
      } as any;

      aiService.setPromptProvider(mockPromptProvider as any);

      // Test hierarchy resolution
      const result = await aiService.resolvePrompt(
        'test_prompt',
        { theme: 'morning', duration: '5min' },
        'christian',
        'proj_123',
        undefined,
        'prayer'
      );

      // Should have all hierarchy levels applied
      expect(result).toContain('base system prompt');
      expect(result).toContain('christian domain override');
      expect(result).toContain('project override');
      expect(result).toContain('prayer content type override');
      // Should have variables substituted
      expect(result).toContain('morning');
      expect(result).toContain('5min');
    });
  });

  describe('GeminiProvider', () => {
    test('should have correct provider name', () => {
      expect(geminiProvider.getProviderName()).toBe('gemini');
    });

    test('should have correct default model', () => {
      expect(geminiProvider.getDefaultModel()).toBe('gemini-1.5-pro');
    });

    test('should be available with API key', () => {
      expect(geminiProvider.isAvailable()).toBe(true);
    });

    test('should generate text', async () => {
      const result = await geminiProvider.generateText(
        'Genera una oración matutina para {día} con tema {tema}.',
        { día: 'lunes', tema: 'alabanza' },
        { temperature: 0.7, maxTokens: 512 }
      );

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('cost');
      expect(typeof result.text).toBe('string');
      expect(typeof result.tokens).toBe('number');
      expect(typeof result.cost).toBe('number');
    });

    test('should generate from template', async () => {
      const result = await geminiProvider.generateFromTemplate(
        'morning_prayer_prompt',
        { tema: 'gratitud' },
        { temperature: 0.5, maxTokens: 256 }
      );

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('cost');
    });
  });

  describe('AIService usage recording', () => {
    test('should record successful usage', async () => {
      // The AIService records usage internally
      // We verify it doesn't throw
      const result = await aiService.generateText(
        'Test prompt for recording usage',
        undefined,
        { temperature: 0.7, maxTokens: 128 }
      );

      // Should return a result even if the provider is dummy
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('cost');
    });

    test('should record error usage when provider fails', async () => {
      // Test with a provider that throws
      const failingProvider = {
        getProviderName: () => 'failing',
        getDefaultModel: () => 'fail-model',
        isAvailable: () => Promise.resolve(true),
        generateText: async () => { throw new Error('Provider error'); },
        generateFromTemplate: async () => { throw new Error('Provider error'); },
      } as unknown as AIProvider;

      aiService.setProvider(failingProvider as any);

      const result = await aiService.generateText('test prompt');
      // Should return result with error, not throw
      expect(result).toHaveProperty('error');
    });
  });

  describe('Provider metadata', () => {
    test('should get provider metadata', () => {
      const metadata = aiService.getProviderMetadata();
      expect(metadata).toHaveProperty('provider');
      expect(metadata).toHaveProperty('model');
      expect(metadata).toHaveProperty('defaultTokens');
      expect(metadata).toHaveProperty('estimatedCostPerCall');
      expect(metadata).toHaveProperty('supportsStreaming');
    });

    test('should get Gemini metadata', () => {
      const metadata = aiService.getProviderMetadata();
      expect(metadata.provider).toBe('gemini');
      expect(metadata.model).toBe('gemini-1.5-pro');
    });
  });

  describe('Provider availability check', () => {
    test('should check availability', async () => {
      const isAvailable = await aiService.checkAvailability();
      expect(isAvailable).toBe(true);
    });
  });
});