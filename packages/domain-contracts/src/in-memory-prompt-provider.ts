/*
 * In-Memory Prompt Provider - Content Automation Platform
 * Lightweight dev/test implementation of PromptProvider.
 * Stores prompt templates in a Map and provides them at runtime.
 * Seed with default templates on creation.
 */

import type { PromptProvider } from './prompt-provider';

interface StoredPrompt {
  template: string;
  variables: string[];
  description: string;
  version: string;
}

const DEFAULT_TEMPLATES: Record<string, StoredPrompt> = {
  // ── Prayers ──
  morning_prayer: {
    template:
      'Escribe una oración cristiana profunda y emotiva para comenzar el día. ' +
      'La oración debe ser idónea para un video corto (Shorts) de {duracion_minutos} minutos. ' +
      'Estilo: {tono}. ' +
      'Tema principal: {tema_principal}. ' +
      'Formato:\n' +
      '1. Saludo íntimo a Dios (2-3 líneas)\n' +
      '2. Gratitud por el nuevo día (2-3 líneas)\n' +
      '3. Petición o reflexión central: {tema_principal} (5-7 líneas)\n' +
      '4. Cierre de fe y esperanza (2-3 líneas)\n\n' +
      'Respetar la sensibilidad cristiana evangélica. Sin humor. ' +
      'Lenguaje claro, cálido, personal. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración para la mañana',
    version: 'latest',
  },
  night_prayer: {
    template:
      'Escribe una oración cristiana para la noche. Duración: {duracion_minutos} minutos. ' +
      'Tono: {tono}. Tema: {tema_principal}. ' +
      'Enfocarse en gratitud, descanso y confianza en Dios. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración para la noche',
    version: 'latest',
  },
  protection_prayer: {
    template:
      'Escribe una oración de protección divina. Duración: {duracion_minutos} minutos. ' +
      'Tono: {tono}. Tema: {tema_principal}. ' +
      'Enfocarse en cobertura espiritual y seguridad en Dios. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración de protección',
    version: 'latest',
  },
  family_prayer: {
    template:
      'Escribe una oración por la familia. Duración: {duracion_minutos} minutos. ' +
      'Tono: {tono}. Tema: {tema_principal}. ' +
      'Enfocarse en unidad, amor y bendición familiar. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración por la familia',
    version: 'latest',
  },
  children_prayer: {
    template:
      'Escribe una oración por los hijos. Duración: {duracion_minutos} minutos. ' +
      'Tono: {tono}. Tema: {tema_principal}. ' +
      'Enfocarse en protección, sabiduría y propósito divino para los hijos. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración por los hijos',
    version: 'latest',
  },
  work_prayer: {
    template:
      'Escribe una oración por el trabajo y sustento. Duración: {duracion_minutos} minutos. ' +
      'Tono: {tono}. Tema: {tema_principal}. ' +
      'Enfocarse en provisión, sabiduría laboral y fidelidad. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración por el trabajo',
    version: 'latest',
  },
  strength_prayer: {
    template:
      'Escribe una oración de fortaleza espiritual. Duración: {duracion_minutos} minutos. ' +
      'Tono: {tono}. Tema: {tema_principal}. ' +
      'Enfocarse en resistencia, fe inquebrantable y poder de Dios. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración de fortaleza',
    version: 'latest',
  },
  hope_prayer: {
    template:
      'Escribe una oración de esperanza cristiana. Duración: {duracion_minutos} minutos. ' +
      'Tono: {tono}. Tema: {tema_principal}. ' +
      'Enfocarse en promesas de Dios, renovación y futuro. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración de esperanza',
    version: 'latest',
  },
  thanksgiving_prayer: {
    template:
      'Escribe una oración de agradecimiento y gratitud. Duración: {duracion_minutos} minutos. ' +
      'Tono: {tono}. Tema: {tema_principal}. ' +
      'Enfocarse en reconocer las bendiciones de Dios. Terminar con amén.',
    variables: ['duracion_minutos', 'tono', 'tema_principal'],
    description: 'Oración de gratitud',
    version: 'latest',
  },

  // ── Bible Verses ──
  daily_verse: {
    template:
      'Selecciona un versículo bíblico relevante para el día de {fecha} y escribe una reflexión corta ' +
      '(máximo {longitud_reflexion} palabras) basada en el versículo. ' +
      'Tema sugerido: {tema_sugerido}. Tono: {tono}. ' +
      'Incluir: referencia del versículo, texto, y una reflexión práctica para el día.',
    variables: ['fecha', 'longitud_reflexion', 'tema_sugerido', 'tono'],
    description: 'Versículo del día con reflexión',
    version: 'latest',
  },
  psalm: {
    template:
      'Selecciona un salmo relevante y escribe una reflexión emotiva. ' +
      'Tema: {tema_sugerido}. Tono: {tono}. ' +
      'Incluir: referencia del salmo, versículos clave, y aplicación personal.',
    variables: ['tema_sugerido', 'tono'],
    description: 'Reflexión sobre un salmo',
    version: 'latest',
  },
  proverb: {
    template:
      'Selecciona un proverbio relevante y escribe una enseñanza práctica. ' +
      'Tema: {tema_sugerido}. Tono: {tono}. ' +
      'Incluir: referencia, texto del proverbio, y aplicación para la vida diaria.',
    variables: ['tema_sugerido', 'tono'],
    description: 'Enseñanza basada en un proverbio',
    version: 'latest',
  },

  // ── Stories ──
  bible_story: {
    template:
      'Cuenta la historia bíblica de {personaje_o_evento} del libro de {libro_biblico} ' +
      'capítulo {capitulo}. Longitud: {longitud} palabras. Enfoque: {enfoque}. ' +
      'Tono: {tono}. ' +
      'Formato narrativo, emotivo, con lección espiritual al final.',
    variables: ['personaje_o_evento', 'libro_biblico', 'capitulo', 'longitud', 'enfoque', 'tono'],
    description: 'Historia bíblica narrada',
    version: 'latest',
  },
  bible_character: {
    template:
      'Escribe una biografía corta del personaje bíblico {personaje_o_evento}. ' +
      'Longitud: {longitud} palabras. Enfoque: {enfoque}. Tono: {tono}. ' +
      'Incluir: contexto histórico, fe, pruebas, y lección espiritual.',
    variables: ['personaje_o_evento', 'longitud', 'enfoque', 'tono'],
    description: 'Biografía de personaje bíblico',
    version: 'latest',
  },
  parable: {
    template:
      'Explica la parábola de {personaje_o_evento} de manera simple y profunda. ' +
      'Longitud: {longitud} palabras. Tono: {tono}. ' +
      'Incluir: contexto, enseñanza de Jesús, y aplicación para hoy.',
    variables: ['personaje_o_evento', 'longitud', 'tono'],
    description: 'Explicación de una parábola',
    version: 'latest',
  },

  // ── Reflections ──
  bible_reflection: {
    template:
      'Escribe una reflexión bíblica sobre el pasaje {pasaje_biblico} ({referencia}). ' +
      'Tema central: {tema_central}. Longitud: {longitud} palabras. Tono: {tono}. ' +
      'Incluir: lectura del pasaje, contexto, reflexión profunda, y aplicación práctica.',
    variables: ['pasaje_biblico', 'referencia', 'tema_central', 'longitud', 'tono'],
    description: 'Reflexión sobre un pasaje bíblico',
    version: 'latest',
  },

  // ── Teaching ──
  christian_teaching: {
    template:
      'Escribe una enseñanza cristiana sobre {tema_doctrinal}. ' +
      'Referencias: {referencias_biblicas}. Profundidad: {nivel_profundidad}. ' +
      'Longitud: {longitud} palabras. Tono: {tono}. ' +
      'Incluir: introducción, desarrollo bíblico, ejemplos, y conclusión práctica.',
    variables: ['tema_doctrinal', 'referencias_biblicas', 'nivel_profundidad', 'longitud', 'tono'],
    description: 'Enseñanza cristiana doctrinal',
    version: 'latest',
  },
  christian_encouragement: {
    template:
      'Escribe un mensaje de ánimo cristiano. Tema: {tema_principal}. ' +
      'Duración: {duracion_minutos} minutos. Tono: {tono}. ' +
      'Enfocarse en consolación, fe renovada, y promesas de Dios.',
    variables: ['tema_principal', 'duracion_minutos', 'tono'],
    description: 'Mensaje de ánimo cristiano',
    version: 'latest',
  },
};

/**
 * In-memory prompt provider for development and testing.
 * Pre-seeded with default Christian content templates.
 */
export class InMemoryPromptProvider implements PromptProvider {
  private templates: Map<string, StoredPrompt> = new Map();

  constructor() {
    // Seed with defaults
    for (const [name, prompt] of Object.entries(DEFAULT_TEMPLATES)) {
      this.templates.set(name, { ...prompt });
    }
  }

  async getPrompt(templateName: string, _version?: string): Promise<string | null> {
    const entry = this.templates.get(templateName);
    return entry?.template ?? null;
  }

  async listVersions(templateName: string): Promise<string[]> {
    const entry = this.templates.get(templateName);
    return entry ? [entry.version] : [];
  }

  async getPromptMetadata(templateName: string): Promise<{
    version: string;
    description: string;
    variables: string[];
  }> {
    const entry = this.templates.get(templateName);
    if (!entry) {
      throw new Error(`Template not found: ${templateName}`);
    }
    return {
      version: entry.version,
      description: entry.description,
      variables: entry.variables,
    };
  }

  async resolvePrompt(
    templateName: string,
    variables?: Record<string, string>,
  ): Promise<string> {
    const template = await this.getPrompt(templateName);
    if (!template) throw new Error(`Template not found: ${templateName}`);
    let result = template;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        result = result.split(`{${key}}`).join(value);
      }
    }
    return result;
  }

  async listTemplates(): Promise<string[]> {
    return Array.from(this.templates.keys());
  }

  async savePromptVersion(
    templateName: string,
    version: string,
    prompt: string,
    variables: string[],
    description: string,
  ): Promise<void> {
    this.templates.set(templateName, {
      template: prompt,
      variables,
      description,
      version,
    });
  }
}
