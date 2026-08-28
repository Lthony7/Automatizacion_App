/*
 * Domain Registry - Content Automation Platform FASE 3
 * Registry for managing content domains (Christian, Automotive, etc.)
 * Core depends only on this registry interface, not on concrete domains.
 *
 * FASE 9.6 hardening:
 *  - Strongly typed with DomainProvider contract.
 *  - Schema validation on register(): every provider must expose all 6 methods.
 *  - validateAll() for boot-time integrity checks.
 *  - Lifecycle hooks (onRegister) for downstream wiring.
 *  - Error messages include domain name for traceability.
 */

import type { DomainProvider } from './domain.interface';

export interface DomainInterface {
  getContentTypes(): string[];
  getValidator(): string;
  getRules(): string[];
  getPrompts(): string[];
  getTemplates(): string[];
  getMetadata(): any;
}

export type RegisterableDomain = DomainProvider | DomainInterface;

/** Methods every DomainProvider must expose (used for schema validation). */
const REQUIRED_PROVIDER_METHODS = [
  'getContentTypes',
  'getValidator',
  'getPromptProvider',
  'getRuleProvider',
  'getTemplateProvider',
  'getKnowledgeProvider',
] as const;

/** Lightweight legacy interface methods (backward compat). */
const LEGACY_INTERFACE_METHODS = [
  'getContentTypes',
  'getValidator',
  'getRules',
  'getPrompts',
  'getTemplates',
  'getMetadata',
] as const;

function isDomainProvider(d: RegisterableDomain): d is DomainProvider {
  return REQUIRED_PROVIDER_METHODS.every((m) => typeof (d as any)[m] === 'function');
}

function isLegacyInterface(d: RegisterableDomain): d is DomainInterface {
  return LEGACY_INTERFACE_METHODS.every((m) => typeof (d as any)[m] === 'function');
}

export interface DomainRegistryEvent {
  domainName: string;
  registeredAt: Date;
}

export type DomainRegistryListener = (event: DomainRegistryEvent) => void;

export class DomainRegistry {
  private domains: Map<string, RegisterableDomain> = new Map();
  private listeners: DomainRegistryListener[] = [];

  /**
   * Register a domain with schema validation.
   * Throws if the domain doesn't implement the required interface methods.
   */
  register(domainName: string, domain: RegisterableDomain): void {
    if (!domainName || typeof domainName !== 'string') {
      throw new Error('DomainRegistry.register: domainName must be a non-empty string');
    }
    if (!domain || typeof domain !== 'object') {
      throw new Error(`DomainRegistry.register: domain "${domainName}" must be an object`);
    }

    // Validate that the domain implements the expected interface
    if (isDomainProvider(domain)) {
      // Full DomainProvider — accepted
    } else if (isLegacyInterface(domain)) {
      // Legacy DomainInterface — accept with warning
      console.warn(
        `[DomainRegistry] "${domainName}" uses legacy DomainInterface. Migrate to DomainProvider.`,
      );
    } else {
      throw new Error(
        `DomainRegistry.register: "${domainName}" does not implement DomainProvider or DomainInterface`,
      );
    }

    if (this.domains.has(domainName)) {
      console.warn(`[DomainRegistry] Overwriting existing domain "${domainName}"`);
    }

    this.domains.set(domainName, domain);
    this.emit({ domainName, registeredAt: new Date() });
  }

  get(domainName: string): RegisterableDomain | undefined {
    return this.domains.get(domainName);
  }

  /** Get a domain strongly typed as DomainProvider (throws if not found or legacy). */
  getProvider(domainName: string): DomainProvider {
    const d = this.domains.get(domainName);
    if (!d) {
      throw new Error(`DomainRegistry.getProvider: "${domainName}" not registered`);
    }
    if (!isDomainProvider(d)) {
      throw new Error(`DomainRegistry.getProvider: "${domainName}" is legacy DomainInterface, not DomainProvider`);
    }
    return d;
  }

  list(): string[] {
    return Array.from(this.domains.keys());
  }

  has(domainName: string): boolean {
    return this.domains.has(domainName);
  }

  /** Boot-time validation: checks all registered domains are valid DomainProviders. */
  validateAll(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const [name, domain] of this.domains) {
      if (!isDomainProvider(domain)) {
        errors.push(`"${name}" does not implement DomainProvider`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  /** Subscribe to registration events (useful for wiring vertical metadata). */
  onRegister(listener: DomainRegistryListener): void {
    this.listeners.push(listener);
  }

  private emit(event: DomainRegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error(`[DomainRegistry] listener error for "${event.domainName}":`, err);
      }
    }
  }
}
