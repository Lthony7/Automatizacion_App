/*
 * Automotive Validator (AutomotiveGuard) - Content Automation Platform FASE 17
 * Implementa las 5 reglas de seguridad:
 *  1) no afirmar diagnósticos como certeza sin datos suficientes
 *  2) advertir cuando una reparación requiere profesional
 *  3) evitar instrucciones peligrosas
 *  4) diferenciar mantenimiento preventivo de reparación
 *  5) no inventar especificaciones del fabricante
 */

import { DomainValidator, ValidationResult } from './domain.interface'

const CERTAINTY_PHRASES = [
  'con certeza es',
  'definitivamente es',
  'sin duda es',
  'el diagnóstico es',
  'es 100% seguro que',
  'está garantizado que',
]

const PROFESSIONAL_KEYWORDS = [
  'frenos',
  'airbag',
  'sistema eléctrico',
  'dirección asistida',
  'transmisión',
  'inyección',
  'bomba de combustible',
]

const DANGEROUS_INSTRUCTIONS = [
  'no use gato',
  'sin desconectar la batería',
  'use gasolina para limpiar',
  'trabaje con el motor caliente sin protección',
  'no use guantes',
  'vierta aceite caliente',
]

const PREVENTIVE_TYPES = ['maintenance', 'oil', 'tires', 'car_tip', 'car_fact']
const REPAIR_KEYWORDS = ['reparar falla', 'sustituir componente dañado', 'corregir avería']

export class AutomotiveValidator implements DomainValidator {
  async validate(content: any): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!content.contentType) errors.push('Content type is required')
    if (!content.title || content.title.trim().length === 0) errors.push('Title is required')

    const script: string = (content.script ?? content.body ?? '') as string
    const text = `${content.title ?? ''} ${script}`.toLowerCase()
    const type: string = content.contentType ?? ''
    const hasEvidence: boolean = Boolean(content.diagnosisEvidence ?? content.hasEvidence)
    const hasProfessionalWarning: boolean = /profesional|taller|mecánico calificado/i.test(script)
    const hasManufacturerSource: boolean = Boolean(content.manufacturerSource ?? content.hasSource)

    // Regla 1: no afirmar diagnósticos como certeza sin datos suficientes
    if (['diagnostics', 'common_failure', 'engine', 'electrical'].includes(type)) {
      const assertsCertainty = CERTAINTY_PHRASES.some(p => text.includes(p))
      if (assertsCertainty && !hasEvidence) {
        warnings.push('No afirmar diagnósticos como certeza cuando no existen datos suficientes; use lenguaje tentativo y recomiende diagnóstico profesional')
      }
    }

    // Regla 2: advertir cuando reparación requiere profesional
    const mentionsProfessionalRepair = PROFESSIONAL_KEYWORDS.some(k => text.includes(k))
    if (mentionsProfessionalRepair && !hasProfessionalWarning) {
      warnings.push('Esta reparación requiere profesional calificado: incluya advertencia para consultar a un profesional')
    }

    // Regla 3: evitar instrucciones peligrosas
    for (const instr of DANGEROUS_INSTRUCTIONS) {
      if (text.includes(instr)) {
        errors.push(`Instrucción peligrosa detectada: "${instr}" — debe corregirse`)
      }
    }

    // Regla 4: diferenciar mantenimiento preventivo de reparación
    if (PREVENTIVE_TYPES.includes(type)) {
      const confusesRepair = REPAIR_KEYWORDS.some(k => text.includes(k))
      if (confusesRepair && !text.includes('mantenimiento preventivo')) {
        warnings.push('Diferencie mantenimiento preventivo de reparación: indique que es preventivo y no corrige una falla existente')
      }
    }

    // Regla 5: no inventar especificaciones del fabricante
    const hasTorqueSpec = /\b\d+\s*nm\b|\b\d+\s*lb-?ft\b|\b\d+\s*psi\b|\bapriete a\b/i.test(script)
    if (hasTorqueSpec && !hasManufacturerSource) {
      warnings.push('No inventar especificaciones del fabricante: cite la fuente o indique "consulte el manual del fabricante"')
    }

    // Validaciones genéricas por tipo
    if (type === 'oil' && !script) warnings.push('Contenido de aceite debe incluir viscosidad y intervalo recomendado')
    if (type === 'tires' && !hasProfessionalWarning && text.includes('neumático')) {
      // ya cubierto por regla 2 en parte, evitar duplicado
    }

    const status = errors.length > 0 ? 'INVALID' : warnings.length > 0 ? 'WARNING' : 'VALID'
    return { status, errors, warnings }
  }

  async getErrors(content: any): Promise<string[]> {
    return (await this.validate(content)).errors
  }

  async getWarnings(content: any): Promise<string[]> {
    return (await this.validate(content)).warnings
  }
}
