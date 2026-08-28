/*
 * Automotive Domain - Content Automation Platform FASE 3
 * Domain registration for Automotive content vertical
 * Registers: content types, prompts, rules, validators, metadata
 * Core never depends on this class directly - only through DomainInterface
*/

import { DomainInterface, DomainRegistry } from './domain.registry';

export class AutomotiveDomain implements DomainInterface {
  constructor(private registry: DomainRegistry) {
    registry.register('automotive', this);
  }

  getContentTypes(): string[] {
    return [
      'maintenance',
      'diagnosis',
      'tips',
      'failures',
      'engine',
      'oil',
      'brakes',
      'tires',
      'electricity',
      'recommendation'
    ];
  }

  getValidator(): string {
    return 'AutomotiveGuard';
  }

  getRules(): string[] {
    return [
      'only APPROVED can enter SCHEDULED',
      'only SCHEDULED can enter PUBLISHING',
      'only PUBLISHING can enter PUBLISHED',
      'technical_accuracy_required',
      'step_by_step_format'
    ];
  }

  getPrompts(): string[] {
    return [
      'maintenance_tip_prompt',
      'diagnosis_guide_prompt',
      'oil_change_prompt',
      'brake_inspection_prompt',
      'engine_troubleshooting_prompt'
    ];
  }

  getTemplates(): string[] {
    return [
      'maintenance_video_template',
      'diagnosis_video_template',
      'tips_video_template',
      'engine_video_template'
    ];
  }

  getMetadata(): any {
    return {
      vertical: 'automotive',
      supportedFormats: ['mp4', 'mov'],
      defaultResolution: '1080x1920',
      defaultFPS: 30,
      ttsProviders: ['google', 'elevenlabs'],
      aiProviders: ['gemini'],
      technicalAccuracyRequired: true,
      commercialUseRestrictions: true,
      attributionRequired: false
    };
  }
}