/*
 * Christian Calendar Configuration - Content Automation Platform FASE 5
 * Configurable publishing calendar for Christian content
 * NO hardcoded schedules in Core - fully configurable per project/tenant
*/

export interface CalendarEvent {
  id: string;
  name: string;
  contentType: string;
  time: string; // HH:MM format (24h)
  timezone: string;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  enabled: boolean;
  variables?: Record<string, string>;
  templateVariant?: string;
  priority: number; // Higher = more important
}

export interface CalendarConfig {
  tenantId?: string;
  projectId?: string;
  vertical: 'christian';
  timezone: string;
  events: CalendarEvent[];
  defaultVariables?: Record<string, string>;
}

export const DEFAULT_CHRISTIAN_CALENDAR: CalendarConfig = {
  vertical: 'christian',
  timezone: 'America/Mexico_City', // Default, configurable per tenant
  events: [
    {
      id: 'morning_prayer_07',
      name: 'Oración de la Mañana',
      contentType: 'morning_prayer',
      time: '07:00',
      timezone: 'America/Mexico_City',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Daily
      enabled: true,
      variables: {
        dia_semana: '{day_name}',
        tema_principal: 'alabanza_y_agradecimiento',
        tono: 'alegre_y_esperanzador',
        duracion_minutos: '3',
      },
      templateVariant: 'default',
      priority: 10,
    },
    {
      id: 'daily_verse_10',
      name: 'Versículo del Día',
      contentType: 'daily_verse',
      time: '10:00',
      timezone: 'America/Mexico_City',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Daily
      enabled: true,
      variables: {
        tema_fecha: '{date_formatted}',
        fecha: '{date_iso}',
        longitud_reflexion: '50',
        tema_sugerido: '{daily_theme}',
      },
      templateVariant: 'default',
      priority: 9,
    },
    {
      id: 'reflection_13',
      name: 'Reflexión del Mediodía',
      contentType: 'bible_reflection',
      time: '13:00',
      timezone: 'America/Mexico_City',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      enabled: true,
      variables: {
        pasaje_biblico: '{passage}',
        referencia: '{reference}',
        tema_central: '{theme}',
        longitud: '200',
      },
      templateVariant: 'default',
      priority: 7,
    },
    {
      id: 'bible_teaching_17',
      name: 'Enseñanza Bíblica de la Tarde',
      contentType: 'christian_teaching',
      time: '17:00',
      timezone: 'America/Mexico_City',
      daysOfWeek: [2, 4], // Tue, Thu
      enabled: true,
      variables: {
        tema_doctrinal: '{doctrinal_theme}',
        referencias_biblicas: '{references}',
        nivel_profundidad: 'intermedio',
        longitud: '300',
      },
      templateVariant: 'default',
      priority: 8,
    },
    {
      id: 'night_prayer_21',
      name: 'Oración de la Noche',
      contentType: 'night_prayer',
      time: '21:00',
      timezone: 'America/Mexico_City',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Daily
      enabled: true,
      variables: {
        tema: 'examen_conciencia_y_paz',
        tono: 'tranquilo_y_paz',
        duracion_minutos: '3',
      },
      templateVariant: 'default',
      priority: 10,
    },
    // Weekend special content
    {
      id: 'weekend_psalm_sat',
      name: 'Salmo del Sábado',
      contentType: 'psalm',
      time: '09:00',
      timezone: 'America/Mexico_City',
      daysOfWeek: [6], // Saturday
      enabled: true,
      variables: {
        numero_salmo: '{random_psalm}',
        enfoque_tematico: 'descanso_y_adoracion',
      },
      templateVariant: 'default',
      priority: 6,
    },
    {
      id: 'sunday_teaching',
      name: 'Enseñanza Dominical',
      contentType: 'christian_teaching',
      time: '10:00',
      timezone: 'America/Mexico_City',
      daysOfWeek: [0], // Sunday
      enabled: true,
      variables: {
        tema_doctrinal: 'la_iglesia_y_su_mision',
        referencias_biblicas: 'Hechos 2:42-47; Mateo 28:19-20',
        nivel_profundidad: 'familiar',
        longitud: '400',
      },
      templateVariant: 'default',
      priority: 8,
    },
    {
      id: 'sunday_encouragement',
      name: 'Ánimo Dominical',
      contentType: 'christian_encouragement',
      time: '19:00',
      timezone: 'America/Mexico_City',
      daysOfWeek: [0], // Sunday
      enabled: true,
      variables: {
        situacion: 'inicio_de_nueva_semana',
        promesa_biblica: 'Filipenses 4:13',
        longitud: '150',
      },
      templateVariant: 'default',
      priority: 7,
    },
  ],
  defaultVariables: {
    bible_version: 'RVR1960',
    language: 'es',
    tone_default: 'reverente_y_cercano',
  },
};

export interface CalendarEventTemplate {
  name: string;
  contentType: string;
  description: string;
  suggestedTime: string;
  suggestedDays: number[];
  defaultVariables: Record<string, string>;
  requiredVariables: string[];
}

export const CHRISTIAN_CALENDAR_EVENT_TEMPLATES: CalendarEventTemplate[] = [
  {
    name: 'Oración Matutina',
    contentType: 'morning_prayer',
    description: 'Oración para comenzar el día con bendición',
    suggestedTime: '07:00',
    suggestedDays: [1, 2, 3, 4, 5, 6, 0],
    defaultVariables: {
      dia_semana: '{day_name}',
      tema_principal: 'alabanza_y_agradecimiento',
      tono: 'alegre_y_esperanzador',
      duracion_minutos: '3',
    },
    requiredVariables: ['dia_semana', 'tema_principal', 'tono', 'duracion_minutos'],
  },
  {
    name: 'Versículo del Día',
    contentType: 'daily_verse',
    description: 'Versículo bíblico para meditar durante el día',
    suggestedTime: '10:00',
    suggestedDays: [1, 2, 3, 4, 5, 6, 0],
    defaultVariables: {
      tema_fecha: '{date_formatted}',
      fecha: '{date_iso}',
      longitud_reflexion: '50',
      tema_sugerido: '{daily_theme}',
    },
    requiredVariables: ['tema_fecha', 'fecha', 'longitud_reflexion', 'tema_sugerido'],
  },
  {
    name: 'Reflexión Bíblica',
    contentType: 'bible_reflection',
    description: 'Reflexión profunda sobre un pasaje bíblico',
    suggestedTime: '13:00',
    suggestedDays: [1, 3, 5],
    defaultVariables: {
      pasaje_biblico: '{passage}',
      referencia: '{reference}',
      tema_central: '{theme}',
      longitud: '200',
    },
    requiredVariables: ['pasaje_biblico', 'referencia', 'tema_central', 'longitud'],
  },
  {
    name: 'Enseñanza Bíblica',
    contentType: 'christian_teaching',
    description: 'Enseñanza doctrinal o práctica',
    suggestedTime: '17:00',
    suggestedDays: [2, 4],
    defaultVariables: {
      tema_doctrinal: '{doctrinal_theme}',
      referencias_biblicas: '{references}',
      nivel_profundidad: 'intermedio',
      longitud: '300',
    },
    requiredVariables: ['tema_doctrinal', 'referencias_biblicas', 'nivel_profundidad', 'longitud'],
  },
  {
    name: 'Oración Nocturna',
    contentType: 'night_prayer',
    description: 'Oración para terminar el día en paz',
    suggestedTime: '21:00',
    suggestedDays: [1, 2, 3, 4, 5, 6, 0],
    defaultVariables: {
      tema: 'examen_conciencia_y_paz',
      tono: 'tranquilo_y_paz',
      duracion_minutos: '3',
    },
    requiredVariables: ['tema', 'tono', 'duracion_minutos'],
  },
];

export function getDefaultChristianCalendar(tenantId?: string, projectId?: string): CalendarConfig {
  return {
    ...DEFAULT_CHRISTIAN_CALENDAR,
    tenantId,
    projectId,
  };
}

export function mergeCalendarConfigs(base: CalendarConfig, override: Partial<CalendarConfig>): CalendarConfig {
  return {
    ...base,
    ...override,
    events: override.events
      ? override.events
      : base.events.map(baseEvent => {
          const overrideEvent = override.events?.find(e => e.id === baseEvent.id);
          return overrideEvent ? { ...baseEvent, ...overrideEvent } : baseEvent;
        }),
    defaultVariables: {
      ...base.defaultVariables,
      ...override.defaultVariables,
    },
  };
}

export function validateCalendarEvent(event: CalendarEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!event.id) errors.push('Event ID is required');
  if (!event.name) errors.push('Event name is required');
  if (!event.contentType) errors.push('Content type is required');
  if (!event.time || !/^\d{2}:\d{2}$/.test(event.time)) {
    errors.push('Time must be in HH:MM format');
  }
  if (!event.timezone) errors.push('Timezone is required');
  if (!event.daysOfWeek || event.daysOfWeek.length === 0) {
    errors.push('At least one day of week is required');
  }
  if (event.daysOfWeek?.some(d => d < 0 || d > 6)) {
    errors.push('Days of week must be 0-6');
  }

  return { valid: errors.length === 0, errors };
}