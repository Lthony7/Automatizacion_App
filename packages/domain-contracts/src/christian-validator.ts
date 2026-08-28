/*
 * Christian Validator (BibleGuard) - Content Automation Platform FASE 5
 * Validates Christian content for biblical accuracy and doctrinal soundness
 * Implements DomainValidator interface
*/

import { DomainValidator, ValidationResult } from './domain.interface';
import { BibleGuard } from './bible-engine/bible-guard';

export class ChristianValidator implements DomainValidator {
  constructor(private readonly bibleGuard = new BibleGuard()) {}

  async validate(content: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate content structure
    if (!content.contentType) {
      errors.push('Content type is required');
    }

    if (!content.title || content.title.trim().length === 0) {
      errors.push('Title is required');
    }

    // Type-specific validation
    const typeValidation = await this.validateByType(content);
    errors.push(...typeValidation.errors);
    warnings.push(...typeValidation.warnings);

    // Bible reference validation
    const references = content.references ?? content.bibleReferences;
    if (references && references.length > 0) {
      const refValidation = this.validateBibleReferences(references);
      errors.push(...refValidation.errors);
      warnings.push(...refValidation.warnings);
    }

    // Doctrinal consistency check
    const doctrinalCheck = this.checkDoctrinalConsistency(content);
    warnings.push(...doctrinalCheck);

    const status = errors.length > 0 ? 'INVALID' : (warnings.length > 0 ? 'WARNING' : 'VALID');

    return {
      status,
      errors,
      warnings,
    };
  }

  async getErrors(content: any): Promise<string[]> {
    const result = await this.validate(content);
    return result.errors;
  }

  async getWarnings(content: any): Promise<string[]> {
    const result = await this.validate(content);
    return result.warnings;
  }

  private async validateByType(content: any): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const body = content.script ?? content.body;
    const references = content.references ?? content.bibleReferences;

    switch (content.contentType) {
      case 'morning_prayer':
      case 'night_prayer':
      case 'protection_prayer':
      case 'family_prayer':
      case 'children_prayer':
      case 'work_prayer':
      case 'strength_prayer':
      case 'hope_prayer':
      case 'thanksgiving_prayer':
        if (!body || body.length < 50) {
          warnings.push('Oración muy corta, se recomienda al menos 50 caracteres');
        }
        break;

      case 'daily_verse':
      case 'psalm':
      case 'proverb':
        if (!references || references.length === 0) {
          errors.push('Los versículos y salmos requieren referencia bíblica');
        }
        break;

      case 'bible_story':
      case 'bible_character':
      case 'parable':
        if (!references || references.length === 0) {
          errors.push('Las historias y parábolas requieren referencia bíblica');
        }
        if (!body || body.length < 200) {
          warnings.push('Las narrativas bíblicas deben tener contenido sustancial');
        }
        break;

      case 'bible_reflection':
      case 'christian_teaching':
      case 'christian_encouragement':
        if (!body || body.length < 100) {
          warnings.push('Las reflexiones y enseñanzas deben tener contenido sustancial');
        }
        if (!references || references.length === 0) {
          warnings.push('Se recomienda incluir referencia bíblica');
        }
        break;
    }

    return { errors, warnings };
  }

  private validateBibleReferences(references: string[]): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const ref of references) {
      const result = this.bibleGuard.validate(ref);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    return { errors, warnings };
  }

  private checkDoctrinalConsistency(content: any): string[] {
    const warnings: string[] = [];

    // Check for potentially problematic content
    const problematicTerms = [
      'reencarnación', 'karma', 'nirvana', 'chakras',
      'horóscopo', 'astrología', 'tarot', 'videncia',
      'magia', 'hechizo', 'brujería',
    ];

    const contentText = `${content.title} ${content.script ?? content.body ?? ''}`.toLowerCase();
    for (const term of problematicTerms) {
      if (contentText.includes(term)) {
        warnings.push(`Posible contenido no compatible con doctrina cristiana: "${term}"`);
      }
    }

    return warnings;
  }
}
