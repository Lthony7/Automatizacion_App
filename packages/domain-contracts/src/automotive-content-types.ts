/*
 * Automotive Content Types - Content Automation Platform FASE 17
 * 10 tipos demostrativos que reutilizan el mismo Core que CHRISTIAN
 * Core no depende de estos — se registran vía DomainProvider
 */

export enum AutomotiveContentType {
  CAR_TIP = 'car_tip',
  MAINTENANCE = 'maintenance',
  ENGINE = 'engine',
  BRAKES = 'brakes',
  OIL = 'oil',
  TIRES = 'tires',
  ELECTRICAL = 'electrical',
  DIAGNOSTICS = 'diagnostics',
  CAR_FACT = 'car_fact',
  COMMON_FAILURE = 'common_failure',
}

export const AUTOMOTIVE_CONTENT_TYPES: AutomotiveContentType[] = Object.values(AutomotiveContentType)

export const AUTOMOTIVE_CONTENT_TYPE_METADATA: Record<AutomotiveContentType, {
  displayName: string
  description: string
  category: 'tip' | 'maintenance' | 'diagnosis' | 'fact'
  defaultDurationMinutes: number
  requiresWarning: boolean
  isRepair: boolean
}> = {
  [AutomotiveContentType.CAR_TIP]: {
    displayName: 'Consejo Automotriz',
    description: 'Consejo práctico de uso diario del vehículo',
    category: 'tip',
    defaultDurationMinutes: 2,
    requiresWarning: false,
    isRepair: false,
  },
  [AutomotiveContentType.MAINTENANCE]: {
    displayName: 'Mantenimiento Preventivo',
    description: 'Rutina de mantenimiento preventivo (revisiones periódicas)',
    category: 'maintenance',
    defaultDurationMinutes: 3,
    requiresWarning: false,
    isRepair: false,
  },
  [AutomotiveContentType.ENGINE]: {
    displayName: 'Motor',
    description: 'Contenido sobre funcionamiento y cuidado del motor',
    category: 'maintenance',
    defaultDurationMinutes: 4,
    requiresWarning: true,
    isRepair: true,
  },
  [AutomotiveContentType.BRAKES]: {
    displayName: 'Frenos',
    description: 'Inspección y mantenimiento del sistema de frenos',
    category: 'maintenance',
    defaultDurationMinutes: 3,
    requiresWarning: true,
    isRepair: true,
  },
  [AutomotiveContentType.OIL]: {
    displayName: 'Aceite y Lubricación',
    description: 'Cambio de aceite y fluidos',
    category: 'maintenance',
    defaultDurationMinutes: 3,
    requiresWarning: false,
    isRepair: false,
  },
  [AutomotiveContentType.TIRES]: {
    displayName: 'Neumáticos',
    description: 'Presión, rotación y cambio de neumáticos',
    category: 'maintenance',
    defaultDurationMinutes: 3,
    requiresWarning: true,
    isRepair: false,
  },
  [AutomotiveContentType.ELECTRICAL]: {
    displayName: 'Sistema Eléctrico',
    description: 'Batería, alternador y sistema eléctrico',
    category: 'maintenance',
    defaultDurationMinutes: 4,
    requiresWarning: true,
    isRepair: true,
  },
  [AutomotiveContentType.DIAGNOSTICS]: {
    displayName: 'Diagnóstico',
    description: 'Posibles causas de una falla a partir de síntomas',
    category: 'diagnosis',
    defaultDurationMinutes: 4,
    requiresWarning: true,
    isRepair: false,
  },
  [AutomotiveContentType.CAR_FACT]: {
    displayName: 'Dato Curioso Automotriz',
    description: 'Dato histórico o técnico verificado',
    category: 'fact',
    defaultDurationMinutes: 2,
    requiresWarning: false,
    isRepair: false,
  },
  [AutomotiveContentType.COMMON_FAILURE]: {
    displayName: 'Falla Común',
    description: 'Falla frecuente y cómo identificarla (sin afirmar certeza)',
    category: 'diagnosis',
    defaultDurationMinutes: 4,
    requiresWarning: true,
    isRepair: false,
  },
}

export function getAutomotiveContentTypeMetadata(type: AutomotiveContentType) {
  return AUTOMOTIVE_CONTENT_TYPE_METADATA[type]
}

export function getAutomotiveContentTypesByCategory(category: typeof AUTOMOTIVE_CONTENT_TYPE_METADATA[AutomotiveContentType]['category']) {
  return AUTOMOTIVE_CONTENT_TYPES.filter(t => AUTOMOTIVE_CONTENT_TYPE_METADATA[t].category === category)
}
