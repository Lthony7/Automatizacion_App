/*
 * Automotive Rule Provider - Content Automation Platform FASE 17
 * Mismo StateMachine que Christian/Core + reglas automotrices
 */

import { DomainRuleProvider } from './domain.interface'

export class AutomotiveRuleProvider implements DomainRuleProvider {
  private validTransitions: Record<string, string[]> = {
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
  }

  async canTransition(_content: any, from: string, to: string, _user: any): Promise<boolean> {
    return this.validTransitions[from]?.includes(to) ?? false
  }

  async getApprovalRequirements(content: any): Promise<{ role: string; minWeight: number }[]> {
    const base = [{ role: 'EDITOR', minWeight: 0.5 }, { role: 'ADMIN', minWeight: 1.0 }]
    // Diagnóstico/falla común requiere editor senior
    if (['diagnostics', 'common_failure', 'engine', 'electrical'].includes(content.contentType)) {
      base.push({ role: 'EDITOR', minWeight: 0.8 })
    }
    return base
  }

  async getCostFactors(content: any): Promise<{ factor: string; baseCost: number }[]> {
    const base = [
      { factor: 'ai_generation', baseCost: 0.002 },
      { factor: 'tts_generation', baseCost: 0.001 },
      { factor: 'video_rendering', baseCost: 0.005 },
      { factor: 'storage', baseCost: 0.0001 },
    ]
    // Tipos con más detalle técnico incrementan complejidad
    if (['engine', 'electrical', 'diagnostics'].includes(content.contentType)) {
      base.push({ factor: 'technical_complexity', baseCost: 0.0006 })
    }
    void content
    return base
  }

  async getPublicationRequirements(content: any): Promise<{ type: string; required: boolean }[]> {
    return [
      { type: 'technical_accuracy_verified', required: true },
      { type: 'safety_warnings_present', required: this.requiresSafetyWarning(content.contentType) },
      { type: 'manufacturer_specs_cited_or_deferred', required: true },
      { type: 'professional_referral_where_needed', required: this.requiresProfessionalReferral(content.contentType) },
    ]
  }

  private requiresSafetyWarning(t: string): boolean {
    return ['brakes', 'electrical', 'engine', 'tires', 'diagnostics', 'common_failure'].includes(t)
  }
  private requiresProfessionalReferral(t: string): boolean {
    return ['brakes', 'electrical', 'engine', 'diagnostics', 'common_failure'].includes(t)
  }
}
