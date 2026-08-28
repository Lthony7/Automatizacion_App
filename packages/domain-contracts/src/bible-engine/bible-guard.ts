import { BibleEngine } from './bible-engine';
import { BibleReferenceValidationResult } from './bible-types';

export class BibleGuard {
  constructor(private readonly bibleEngine = new BibleEngine()) {}

  validate(reference: string): BibleReferenceValidationResult {
    return this.bibleEngine.validate(reference);
  }

  validateReferences(references: string[]): BibleReferenceValidationResult[] {
    return references.map((reference) => this.validate(reference));
  }

  hasBlockingErrors(references: string[] | undefined): boolean {
    return (references ?? []).some((reference) => this.validate(reference).status === 'INVALID');
  }
}
