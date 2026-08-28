/*
 * DomainRegistry Tests — FASE 9.6 hardening
 * Covers: typed registration, schema validation, legacy compat, lifecycle hooks.
 */

import { DomainRegistry } from 'domain-contracts/domain.registry';

// Minimal DomainProvider mock (all 6 methods present)
function makeValidProvider() {
  return {
    getContentTypes: async () => [],
    getValidator: () => ({ validate: async () => ({ status: 'VALID' as const, errors: [], warnings: [] }), getErrors: async () => [], getWarnings: async () => [] }),
    getPromptProvider: () => ({ getPrompts: async () => [], getPrompt: async () => 'prompt', listVersions: async () => [] }),
    getRuleProvider: () => ({ canTransition: async () => true, getApprovalRequirements: async () => [], getCostFactors: async () => [], getPublicationRequirements: async () => [] }),
    getTemplateProvider: () => ({ getTemplates: async () => [], getTemplate: async () => ({}), validateTemplate: async () => 'VALID' as const }),
    getKnowledgeProvider: () => ({ search: async () => [], getVerse: async () => null, getTechnicalTerm: async () => ({}) }),
  };
}

// Legacy DomainInterface mock (old style)
function makeLegacyProvider() {
  return {
    getContentTypes: () => ['prayer'],
    getValidator: () => 'bible-guard',
    getRules: () => ['no-heresy'],
    getPrompts: () => ['morning-prayer'],
    getTemplates: () => ['christian-default'],
    getMetadata: () => ({ vertical: 'christian' }),
  };
}

describe('DomainRegistry', () => {
  let registry: DomainRegistry;

  beforeEach(() => {
    registry = new DomainRegistry();
  });

  describe('register + get', () => {
    it('registers and retrieves a valid DomainProvider', () => {
      const provider = makeValidProvider();
      registry.register('christian', provider);
      expect(registry.has('christian')).toBe(true);
      expect(registry.get('christian')).toBe(provider);
    });

    it('getProvider returns strongly typed provider', () => {
      const provider = makeValidProvider();
      registry.register('christian', provider);
      expect(registry.getProvider('christian')).toBe(provider);
    });

    it('getProvider throws for unregistered domain', () => {
      expect(() => registry.getProvider('nonexistent')).toThrow('not registered');
    });

    it('list returns all registered domain names', () => {
      registry.register('christian', makeValidProvider());
      registry.register('automotive', makeValidProvider());
      expect(registry.list()).toEqual(['christian', 'automotive']);
    });
  });

  describe('schema validation', () => {
    it('rejects object missing required DomainProvider methods', () => {
      const incomplete = { getContentTypes: async () => [] };
      expect(() => registry.register('bad', incomplete as any)).toThrow('does not implement');
    });

    it('rejects object with only partial DomainProvider methods', () => {
      const partial = {
        getContentTypes: async () => [],
        getValidator: () => ({}),
        getPromptProvider: () => ({}),
        getRuleProvider: () => ({}),
        getTemplateProvider: () => ({}),
        // missing getKnowledgeProvider — not enough for DomainProvider or DomainInterface
      };
      expect(() => registry.register('partial', partial as any)).toThrow('does not implement');
    });

    it('rejects non-string domain name', () => {
      expect(() => registry.register('', makeValidProvider())).toThrow('non-empty string');
      expect(() => registry.register(null as any, makeValidProvider())).toThrow('non-empty string');
    });

    it('rejects non-object domain', () => {
      expect(() => registry.register('bad', 'not-an-object' as any)).toThrow('must be an object');
    });

    it('accepts legacy DomainInterface with warning', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      const legacy = makeLegacyProvider();
      registry.register('legacy', legacy);
      expect(registry.has('legacy')).toBe(true);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('legacy DomainInterface'),
      );
      spy.mockRestore();
    });

    it('warns on overwrite of existing domain', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      registry.register('christian', makeValidProvider());
      registry.register('christian', makeValidProvider());
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Overwriting existing domain'),
      );
      spy.mockRestore();
    });
  });

  describe('validateAll', () => {
    it('returns valid for all DomainProviders', () => {
      registry.register('christian', makeValidProvider());
      registry.register('automotive', makeValidProvider());
      const result = registry.validateAll();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('reports errors for legacy interfaces', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      registry.register('legacy', makeLegacyProvider());
      const result = registry.validateAll();
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('legacy');
      spy.mockRestore();
    });

    it('returns valid for empty registry', () => {
      const result = registry.validateAll();
      expect(result.valid).toBe(true);
    });
  });

  describe('lifecycle hooks', () => {
    it('calls onRegister listener when domain is registered', () => {
      const listener = jest.fn();
      registry.onRegister(listener);
      registry.register('christian', makeValidProvider());
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ domainName: 'christian' }),
      );
    });

    it('handles listener errors gracefully', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      registry.onRegister(() => { throw new Error('listener boom'); });
      expect(() => registry.register('christian', makeValidProvider())).not.toThrow();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
