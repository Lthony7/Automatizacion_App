/*
 * Christian Rule Provider - Content Automation Platform FASE 5
 * Business rules and workflow rules for Christian content
 * Implements DomainRuleProvider interface
*/

import { DomainRuleProvider } from './domain.interface';
import { BibleGuard } from './bible-engine/bible-guard';

export class ChristianRuleProvider implements DomainRuleProvider {
  constructor(private readonly bibleGuard = new BibleGuard()) {}

  async canTransition(content: any, from: string, to: string, user: any): Promise<boolean> {
    const references = content.references ?? content.bibleReferences;
    // State machine validation (enforced by Core, but domain can add rules)
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['QUEUED', 'CANCELLED'],
      QUEUED: ['GENERATING', 'DRAFT', 'CANCELLED'],
      GENERATING: ['GENERATED', 'FAILED'],
      GENERATED: ['VALIDATING', 'DRAFT'],
      VALIDATING: ['VALIDATED', 'GENERATED'],
      VALIDATED: ['AUDIO_GENERATING', 'RENDERING', 'GENERATED'],
      AUDIO_GENERATING: ['AUDIO_GENERATED', 'FAILED'],
      AUDIO_GENERATED: ['RENDERING', 'AUDIO_GENERATING'],
      RENDERING: ['RENDERED', 'FAILED'],
      RENDERED: ['AI_REVIEW', 'RENDERING'],
      AI_REVIEW: ['PENDING_APPROVAL', 'RENDERED'],
      PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'EDITING'],
      EDITING: ['PENDING_APPROVAL', 'DRAFT'],
      REJECTED: ['PENDING_APPROVAL', 'DRAFT'],
      APPROVED: ['SCHEDULED', 'PENDING_APPROVAL'],
      SCHEDULED: ['PUBLISHING', 'APPROVED', 'CANCELLED'],
      PUBLISHING: ['PUBLISHED', 'FAILED'],
      PUBLISHED: [],
      FAILED: ['QUEUED', 'DRAFT', 'CANCELLED'],
      CANCELLED: ['DRAFT'],
    };

    const allowed = validTransitions[from]?.includes(to) || false;

    // References must pass Bible Guard before validation can complete or media work begins.
    if (
      allowed &&
      ['VALIDATING', 'VALIDATED'].includes(from) &&
      ['VALIDATED', 'AUDIO_GENERATING', 'RENDERING'].includes(to) &&
      this.bibleGuard.hasBlockingErrors(references)
    ) {
      return false;
    }

    // Additional Christian-specific rules
    if (allowed && from === 'VALIDATED' && to === 'AUDIO_GENERATING') {
      // Christian content requires Bible reference check before audio generation
      if (this.requiresBibleReference(content.contentType) && !references?.length) {
        return false;
      }
    }

    if (allowed && from === 'PENDING_APPROVAL' && to === 'APPROVED') {
      // Christian content requires pastoral/theological review for certain types
      if (this.requiresPastoralReview(content.contentType)) {
        // In real implementation, check if user has pastoral role
        // For now, allow if user has appropriate role
        return user?.roles?.includes('PASTOR') || user?.roles?.includes('THEOLOGIAN') || user?.roles?.includes('ADMIN');
      }
    }

    return allowed;
  }

  async getApprovalRequirements(content: any): Promise<{ role: string; minWeight: number }[]> {
    const baseRequirements = [
      { role: 'EDITOR', minWeight: 0.5 },
      { role: 'ADMIN', minWeight: 1.0 },
    ];

    // Christian-specific approval requirements
    if (this.requiresPastoralReview(content.contentType)) {
      baseRequirements.push({ role: 'PASTOR', minWeight: 1.0 });
      baseRequirements.push({ role: 'THEOLOGIAN', minWeight: 0.8 });
    }

    // Prayer content requires at least editor
    if (this.isPrayerContent(content.contentType)) {
      baseRequirements.push({ role: 'EDITOR', minWeight: 0.6 });
    }

    // Doctrinal content requires theological review
    if (this.isDoctrinalContent(content.contentType)) {
      baseRequirements.push({ role: 'THEOLOGIAN', minWeight: 1.0 });
    }

    return baseRequirements;
  }

  async getCostFactors(content: any): Promise<{ factor: string; baseCost: number }[]> {
    const factors = [
      { factor: 'ai_generation', baseCost: 0.002 },
      { factor: 'tts_generation', baseCost: 0.001 },
      { factor: 'video_rendering', baseCost: 0.005 },
      { factor: 'storage', baseCost: 0.0001 },
    ];

    // Adjust costs based on content type
    const metadata = this.getContentTypeMetadata(content.contentType);
    if (metadata) {
      factors.push({
        factor: 'content_complexity',
        baseCost: metadata.defaultDurationMinutes * 0.0002,
      });
    }

    return factors;
  }

  async getPublicationRequirements(content: any): Promise<{ type: string; required: boolean }[]> {
    const requirements = [
      { type: 'bible_accuracy_verified', required: this.requiresBibleReference(content.contentType) },
      { type: 'doctrinal_review_passed', required: this.isDoctrinalContent(content.contentType) },
      { type: 'pastoral_approval', required: this.requiresPastoralReview(content.contentType) },
      { type: 'bible_references_present', required: this.requiresBibleReference(content.contentType) },
      { type: 'appropriate_tone', required: true },
      { type: 'no_doctrinal_errors', required: true },
    ];

    return requirements;
  }

  private requiresBibleReference(contentType: string): boolean {
    const verseTypes = ['daily_verse', 'psalm', 'proverb'];
    const storyTypes = ['bible_story', 'bible_character', 'parable'];
    const doctrinalTypes = ['bible_reflection', 'christian_teaching', 'christian_encouragement'];
    const prayerTypes = ['protection_prayer', 'strength_prayer', 'hope_prayer'];

    return [
      ...verseTypes,
      ...storyTypes,
      ...doctrinalTypes,
      ...prayerTypes,
    ].includes(contentType);
  }

  private requiresPastoralReview(contentType: string): boolean {
    const pastoralTypes = ['christian_teaching', 'bible_reflection', 'parable'];
    return pastoralTypes.includes(contentType);
  }

  private isPrayerContent(contentType: string): boolean {
    return contentType.endsWith('_prayer');
  }

  private isDoctrinalContent(contentType: string): boolean {
    return ['bible_reflection', 'christian_teaching', 'christian_encouragement'].includes(contentType);
  }

  private getContentTypeMetadata(contentType: string) {
    // This would be imported from christian-content-types in real implementation
    return {
      defaultDurationMinutes: 3,
    };
  }
}
