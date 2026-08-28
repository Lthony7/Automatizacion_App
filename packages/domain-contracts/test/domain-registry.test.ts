/*
 * Domain Registry Tests - Content Automation Platform FASE 3
 * Tests for DomainRegistry, ChristianDomain, and AutomotiveDomain
*/

import { DomainRegistry } from '../src/domain.registry';
import { ChristianDomain } from '../src/christian.domain';
import { AutomotiveDomain } from '../src/automotive.domain';

describe('Domain Registry FASE 3', () => {
  let registry: DomainRegistry;

  beforeEach(() => {
    registry = new DomainRegistry();
    // Register domains before each test
    new ChristianDomain(registry);
    new AutomotiveDomain(registry);
  });

  describe('register domain', () => {
    test('should register a Christian domain', () => {
      expect(registry.has('christian')).toBe(true);
    });

    test('should register an Automotive domain', () => {
      expect(registry.has('automotive')).toBe(true);
    });

    test('should allow multiple domains', () => {
      expect(registry.list()).toContain('christian');
      expect(registry.list()).toContain('automotive');
      expect(registry.list().length).toBe(2);
    });
  });

  describe('retrieve domain', () => {
    test('should retrieve Christian domain', () => {
      const domain = registry.get('christian');
      expect(domain).toBeDefined();
      if (domain) {
        expect(domain.getContentTypes()).toContain('prayer');
        expect(domain.getValidator()).toBe('BibleGuard');
      }
    });

    test('should retrieve Automotive domain', () => {
      const domain = registry.get('automotive');
      expect(domain).toBeDefined();
      if (domain) {
        expect(domain.getContentTypes()).toContain('maintenance');
        expect(domain.getValidator()).toBe('AutomotiveGuard');
      }
    });
  });

  describe('unknown domain', () => {
    test('should return undefined for unknown domain', () => {
      const domain = registry.get('unknown');
      expect(domain).toBeUndefined();
    });

    test('should return false for has() on unknown domain', () => {
      expect(registry.has('unknown')).toBe(false);
    });
  });

  describe('content type discovery', () => {
    test('Christian domain content types', () => {
      const christian = registry.get('christian') as import('../src/domain.registry').DomainInterface | undefined;
      expect(christian).toBeDefined();
      if (christian) {
        const types = christian.getContentTypes();
        expect(types).toContain('prayer');
        expect(types).toContain('verse');
        expect(types).toContain('story');
        expect(types).toContain('teaching');
        expect(types.length).toBeGreaterThan(0);
      }
    });

    test('Automotive domain content types', () => {
      const automotive = registry.get('automotive') as import('../src/domain.registry').DomainInterface | undefined;
      expect(automotive).toBeDefined();
      if (automotive) {
        const types = automotive.getContentTypes();
        expect(types).toContain('maintenance');
        expect(types).toContain('diagnosis');
        expect(types).toContain('tips');
        expect(types).toContain('engine');
      }
    });
  });

  describe('validator discovery', () => {
    test('Christian domain uses BibleGuard validator', () => {
      const christian = registry.get('christian') as import('../src/domain.registry').DomainInterface | undefined;
      expect(christian).toBeDefined();
      if (christian) {
        expect(christian.getValidator()).toBe('BibleGuard');
      }
    });

    test('Automotive domain uses AutomotiveGuard validator', () => {
      const automotive = registry.get('automotive') as import('../src/domain.registry').DomainInterface | undefined;
      expect(automotive).toBeDefined();
      if (automotive) {
        expect(automotive.getValidator()).toBe('AutomotiveGuard');
      }
    });
  });

  describe('rules discovery', () => {
    test('Christian domain rules', () => {
      const christian = registry.get('christian') as import('../src/domain.registry').DomainInterface | undefined;
      expect(christian).toBeDefined();
      if (christian) {
        const rules = christian.getRules();
        expect(rules).toContain('only APPROVED can enter SCHEDULED');
        expect(rules).toContain('only SCHEDULED can enter PUBLISHING');
        expect(rules.length).toBeGreaterThan(0);
      }
    });

    test('Automotive domain rules', () => {
      const automotive = registry.get('automotive') as import('../src/domain.registry').DomainInterface | undefined;
      expect(automotive).toBeDefined();
      if (automotive) {
        const rules = automotive.getRules();
        expect(rules).toContain('only APPROVED can enter SCHEDULED');
        expect(rules).toContain('technical_accuracy_required');
        expect(rules.length).toBeGreaterThan(0);
      }
    });
  });

  describe('prompts discovery', () => {
    test('Christian domain prompts', () => {
      const christian = registry.get('christian') as import('../src/domain.registry').DomainInterface | undefined;
      expect(christian).toBeDefined();
      if (christian) {
        const prompts = christian.getPrompts();
        expect(prompts).toContain('morning_prayer_prompt');
        expect(prompts).toContain('verse_of_day_prompt');
      }
    });

    test('Automotive domain prompts', () => {
      const automotive = registry.get('automotive') as import('../src/domain.registry').DomainInterface | undefined;
      expect(automotive).toBeDefined();
      if (automotive) {
        const prompts = automotive.getPrompts();
        expect(prompts).toContain('maintenance_tip_prompt');
        expect(prompts).toContain('diagnosis_guide_prompt');
      }
    });
  });

  describe('templates discovery', () => {
    test('Christian domain templates', () => {
      const christian = registry.get('christian') as import('../src/domain.registry').DomainInterface | undefined;
      expect(christian).toBeDefined();
      if (christian) {
        const templates = christian.getTemplates();
        expect(templates).toContain('prayer_video_template');
        expect(templates).toContain('verse_video_template');
      }
    });

    test('Automotive domain templates', () => {
      const automotive = registry.get('automotive') as import('../src/domain.registry').DomainInterface | undefined;
      expect(automotive).toBeDefined();
      if (automotive) {
        const templates = automotive.getTemplates();
        expect(templates).toContain('maintenance_video_template');
        expect(templates).toContain('engine_video_template');
      }
    });
  });

  describe('metadata discovery', () => {
    test('Christian domain metadata', () => {
      const christian = registry.get('christian') as import('../src/domain.registry').DomainInterface | undefined;
      expect(christian).toBeDefined();
      if (christian) {
        const metadata = christian.getMetadata();
        expect(metadata.vertical).toBe('christian');
        expect(metadata.bibleVersion).toBeDefined();
        expect(metadata.supportedFormats).toBeDefined();
      }
    });

    test('Automotive domain metadata', () => {
      const automotive = registry.get('automotive') as import('../src/domain.registry').DomainInterface | undefined;
      expect(automotive).toBeDefined();
      if (automotive) {
        const metadata = automotive.getMetadata();
        expect(metadata.vertical).toBe('automotive');
        expect(metadata.technicalAccuracyRequired).toBeDefined();
        expect(metadata.supportedFormats).toBeDefined();
      }
    });
  });
});