/*
 * Christian Content Types - Content Automation Platform FASE 5
 * Complete enumeration of Christian content types
 * Core does not depend on these - they are registered via DomainProvider
*/

export enum ChristianContentType {
  MORNING_PRAYER = 'morning_prayer',
  NIGHT_PRAYER = 'night_prayer',
  PROTECTION_PRAYER = 'protection_prayer',
  FAMILY_PRAYER = 'family_prayer',
  CHILDREN_PRAYER = 'children_prayer',
  WORK_PRAYER = 'work_prayer',
  STRENGTH_PRAYER = 'strength_prayer',
  HOPE_PRAYER = 'hope_prayer',
  THANKSGIVING_PRAYER = 'thanksgiving_prayer',
  DAILY_VERSE = 'daily_verse',
  PSALM = 'psalm',
  PROVERB = 'proverb',
  BIBLE_STORY = 'bible_story',
  BIBLE_CHARACTER = 'bible_character',
  PARABLE = 'parable',
  BIBLE_REFLECTION = 'bible_reflection',
  CHRISTIAN_TEACHING = 'christian_teaching',
  CHRISTIAN_ENCOURAGEMENT = 'christian_encouragement',
}

export const CHRISTIAN_CONTENT_TYPES: ChristianContentType[] = Object.values(ChristianContentType);

export const CHRISTIAN_CONTENT_TYPE_METADATA: Record<ChristianContentType, {
  displayName: string;
  description: string;
  category: 'prayer' | 'verse' | 'story' | 'reflection' | 'teaching';
  defaultDurationMinutes: number;
  requiresBibleReference: boolean;
  isPrayer: boolean;
}> = {
  [ChristianContentType.MORNING_PRAYER]: {
    displayName: 'Oración de la Mañana',
    description: 'Oración para comenzar el día con bendición',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: false,
    isPrayer: true,
  },
  [ChristianContentType.NIGHT_PRAYER]: {
    displayName: 'Oración de la Noche',
    description: 'Oración para terminar el día en paz',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: false,
    isPrayer: true,
  },
  [ChristianContentType.PROTECTION_PRAYER]: {
    displayName: 'Oración de Protección',
    description: 'Oración por protección y seguridad',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: true,
    isPrayer: true,
  },
  [ChristianContentType.FAMILY_PRAYER]: {
    displayName: 'Oración por la Familia',
    description: 'Oración por unidad y bendición familiar',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: false,
    isPrayer: true,
  },
  [ChristianContentType.CHILDREN_PRAYER]: {
    displayName: 'Oración por los Hijos',
    description: 'Oración por protección y guía de los hijos',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: false,
    isPrayer: true,
  },
  [ChristianContentType.WORK_PRAYER]: {
    displayName: 'Oración por el Trabajo',
    description: 'Oración por sabiduría y provisión laboral',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: false,
    isPrayer: true,
  },
  [ChristianContentType.STRENGTH_PRAYER]: {
    displayName: 'Oración por Fortaleza',
    description: 'Oración por fuerza en momentos difíciles',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: true,
    isPrayer: true,
  },
  [ChristianContentType.HOPE_PRAYER]: {
    displayName: 'Oración de Esperanza',
    description: 'Oración para renovar la esperanza',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: true,
    isPrayer: true,
  },
  [ChristianContentType.THANKSGIVING_PRAYER]: {
    displayName: 'Oración de Agradecimiento',
    description: 'Oración de gratitud por bendiciones',
    category: 'prayer',
    defaultDurationMinutes: 3,
    requiresBibleReference: false,
    isPrayer: true,
  },
  [ChristianContentType.DAILY_VERSE]: {
    displayName: 'Versículo del Día',
    description: 'Versículo bíblico para meditar',
    category: 'verse',
    defaultDurationMinutes: 2,
    requiresBibleReference: true,
    isPrayer: false,
  },
  [ChristianContentType.PSALM]: {
    displayName: 'Salmo',
    description: 'Salmo completo para meditación',
    category: 'verse',
    defaultDurationMinutes: 4,
    requiresBibleReference: true,
    isPrayer: false,
  },
  [ChristianContentType.PROVERB]: {
    displayName: 'Proverbio',
    description: 'Proverbio bíblico para sabiduría',
    category: 'verse',
    defaultDurationMinutes: 2,
    requiresBibleReference: true,
    isPrayer: false,
  },
  [ChristianContentType.BIBLE_STORY]: {
    displayName: 'Historia Bíblica',
    description: 'Narrativa de una historia bíblica',
    category: 'story',
    defaultDurationMinutes: 5,
    requiresBibleReference: true,
    isPrayer: false,
  },
  [ChristianContentType.BIBLE_CHARACTER]: {
    displayName: 'Personaje Bíblico',
    description: 'Perfil y enseñanzas de un personaje bíblico',
    category: 'story',
    defaultDurationMinutes: 5,
    requiresBibleReference: true,
    isPrayer: false,
  },
  [ChristianContentType.PARABLE]: {
    displayName: 'Parábola',
    description: 'Explicación de una parábola de Jesús',
    category: 'story',
    defaultDurationMinutes: 4,
    requiresBibleReference: true,
    isPrayer: false,
  },
  [ChristianContentType.BIBLE_REFLECTION]: {
    displayName: 'Reflexión Bíblica',
    description: 'Reflexión profunda sobre un pasaje',
    category: 'reflection',
    defaultDurationMinutes: 4,
    requiresBibleReference: true,
    isPrayer: false,
  },
  [ChristianContentType.CHRISTIAN_TEACHING]: {
    displayName: 'Enseñanza Cristiana',
    description: 'Enseñanza doctrinal o práctica',
    category: 'teaching',
    defaultDurationMinutes: 5,
    requiresBibleReference: true,
    isPrayer: false,
  },
  [ChristianContentType.CHRISTIAN_ENCOURAGEMENT]: {
    displayName: 'Ánimo Cristiano',
    description: 'Palabra de ánimo basada en la fe',
    category: 'teaching',
    defaultDurationMinutes: 3,
    requiresBibleReference: true,
    isPrayer: false,
  },
};

export function getChristianContentTypeMetadata(type: ChristianContentType) {
  return CHRISTIAN_CONTENT_TYPE_METADATA[type];
}

export function getChristianContentTypesByCategory(category: string) {
  return CHRISTIAN_CONTENT_TYPES.filter(
    type => CHRISTIAN_CONTENT_TYPE_METADATA[type].category === category
  );
}