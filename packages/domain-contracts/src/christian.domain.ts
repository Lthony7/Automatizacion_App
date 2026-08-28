/*
 * Christian Domain - Content Automation Platform FASE 3
 * Domain registration for Christian content vertical
 * Registers: content types, prompts, rules, validators, metadata
 * Core never depends on this class directly - only through DomainInterface
*/

import { DomainInterface, DomainRegistry } from './domain.registry';

export class ChristianDomain implements DomainInterface {
  constructor(private registry: DomainRegistry) {
    registry.register('christian', this);
  }

  getContentTypes(): string[] {
    return [
      'prayer',
      'verse',
      'reflection',
      'story',
      'character',
      'parable',
      'teaching',
      'curiosity',
      'testimony',
      'blessing'
    ];
  }

  getValidator(): string {
    return 'BibleGuard';
  }

  getRules(): string[] {
    return [
      'only APPROVED can enter SCHEDULED',
      'only SCHEDULED can enter PUBLISHING',
      'only PUBLISHING can enter PUBLISHED',
      'biblical_accuracy_required',
      'verse_must_have_reference'
    ];
  }

  getPrompts(): string[] {
    return [
      'morning_prayer_prompt',
      'verse_of_day_prompt',
      'evening_prayer_prompt',
      'gratitude_prayer_prompt',
      'protection_prayer_prompt'
    ];
  }

  getTemplates(): string[] {
    return [
      'prayer_video_template',
      'verse_video_template',
      'story_video_template',
      'character_video_template'
    ];
  }

  getMetadata(): any {
    return {
      vertical: 'christian',
      supportedFormats: ['mp4', 'mov'],
      defaultResolution: '1080x1920',
      defaultFPS: 30,
      ttsProviders: ['google', 'elevenlabs'],
      aiProviders: ['gemini'],
      bibleVersion: 'Reina-Valera 1960',
      commercialUseRestrictions: true,
      attributionRequired: true
    };
  }
}