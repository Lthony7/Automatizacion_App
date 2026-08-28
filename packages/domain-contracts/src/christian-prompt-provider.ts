/*
 * Christian Prompt Provider - Content Automation Platform FASE 5
 * Manages prompt templates for Christian content with versioning
 * Implements DomainPromptProvider interface
 * No hardcoded prompts in Core - all configurable
*/

import { DomainPromptProvider, Prompt } from './domain.interface';

export class ChristianPromptProvider implements DomainPromptProvider {
  private prompts: Map<string, Prompt[]> = new Map();

  constructor() {
    this.initializeDefaultPrompts();
  }

  async getPrompts(contentType: string, version?: string): Promise<Prompt[]> {
    const prompts = this.prompts.get(contentType) || [];
    if (version) {
      return prompts.filter(p => p.version === version);
    }
    return prompts;
  }

  async getPrompt(contentType: string, variables: Record<string, string>): Promise<string> {
    const prompts = this.prompts.get(contentType) || [];
    const defaultPrompt = prompts.find(p => p.isDefault) || prompts[0];
    if (!defaultPrompt) {
      throw new Error(`No prompt found for content type: ${contentType}`);
    }

    let template = defaultPrompt.template;
    for (const [key, value] of Object.entries(variables)) {
      template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return template;
  }

  async listVersions(contentType: string): Promise<{ version: string; releasedAt: Date }[]> {
    const prompts = this.prompts.get(contentType) || [];
    return prompts.map(p => ({
      version: p.version,
      releasedAt: new Date(), // Would be actual release date
    }));
  }

  private initializeDefaultPrompts(): void {
    // Prayer templates
    this.addPrompt('morning_prayer', '1.0.0', 'Oración Matutina Base',
      'Genera una oración matutina para {dia_semana} con tema {tema_principal}. ' +
      'Incluye alabanza, petición y agradecimiento. ' +
      'Mantén un tono {tono} y extensión de {duracion_minutos} minutos. ' +
      'No incluyas referencias bíblicas específicas a menos que se soliciten.',
      ['dia_semana', 'tema_principal', 'tono', 'duracion_minutos'],
      true);

    this.addPrompt('night_prayer', '1.0.0', 'Oración Nocturna Base',
      'Genera una oración nocturna de {tema} para terminar el día. ' +
      'Incluye examen de conciencia, perdón y encomienda. ' +
      'Tono {tono}, duración {duracion_minutos} minutos.',
      ['tema', 'tono', 'duracion_minutos'],
      true);

    this.addPrompt('protection_prayer', '1.0.0', 'Oración de Protección',
      'Genera una oración de protección para {quien} contra {contra_que}. ' +
      'Basada en {referencia_biblica}. Incluye petición de ángel guardián y paz. ' +
      'Tono {tono}, extensión {duracion_minutos} min.',
      ['quien', 'contra_que', 'referencia_biblica', 'tono', 'duracion_minutos'],
      true);

    this.addPrompt('family_prayer', '1.0.0', 'Oración por la Familia',
      'Genera una oración por la familia de {tipo_familia}. ' +
      'Pide por {intencion_especifica}. Incluye bendición para cada miembro. ' +
      'Tono {tono}, {duracion_minutos} min.',
      ['tipo_familia', 'intencion_especifica', 'tono', 'duracion_minutos'],
      true);

    this.addPrompt('children_prayer', '1.0.0', 'Oración por los Hijos',
      'Genera una oración por {numero_hijos} hijos de {edades}. ' +
      'Pide por {areas_especificas}: protección, sabiduría, fe, salud. ' +
      'Tono de {tono_padre_madre}, {duracion_minutos} min.',
      ['numero_hijos', 'edades', 'areas_especificas', 'tono_padre_madre', 'duracion_minutos'],
      true);

    this.addPrompt('work_prayer', '1.0.0', 'Oración por el Trabajo',
      'Genera oración para {situacion_laboral}: {detalle}. ' +
      'Pide sabiduría, integridad, provisión y buen testimonio. ' +
      'Tono {tono}, {duracion_minutos} min.',
      ['situacion_laboral', 'detalle', 'tono', 'duracion_minutos'],
      true);

    this.addPrompt('strength_prayer', '1.0.0', 'Oración por Fortaleza',
      'Genera oración por fortaleza en {situacion_dificil}. ' +
      'Basada en {referencia_biblica}. Pide fuerza, fe y esperanza. ' +
      'Tono {tono}, {duracion_minutos} min.',
      ['situacion_dificil', 'referencia_biblica', 'tono', 'duracion_minutos'],
      true);

    this.addPrompt('hope_prayer', '1.0.0', 'Oración de Esperanza',
      'Genera oración de esperanza para {contexto}. ' +
      'Enfatiza promesas de Dios: {promesas}. Tono {tono}, {duracion_minutos} min.',
      ['contexto', 'promesas', 'tono', 'duracion_minutos'],
      true);

    this.addPrompt('thanksgiving_prayer', '1.0.0', 'Oración de Agradecimiento',
      'Genera oración de gratitud por {bendiciones}. ' +
      'Incluye acción de gracias específica y confianza futura. ' +
      'Tono {tono_gratitud}, {duracion_minutos} min.',
      ['bendiciones', 'tono_gratitud', 'duracion_minutos'],
      true);

    // Verse templates
    this.addPrompt('daily_verse', '1.0.0', 'Versículo del Día',
      'Selecciona un versículo bíblico apropiado para {tema_fecha} ({fecha}). ' +
      'Formato: Referencia - Texto completo. ' +
      'Incluye breve reflexión de {longitud_reflexion} palabras. ' +
      'Tema sugerido: {tema_sugerido}.',
      ['tema_fecha', 'fecha', 'longitud_reflexion', 'tema_sugerido'],
      true);

    this.addPrompt('psalm', '1.0.0', 'Salmo Completo',
      'Presenta el Salmo {numero_salmo} completo. ' +
      'Formato: Título, versículos numerados, breve introducción y aplicación. ' +
      'Enfoque: {enfoque_tematico}.',
      ['numero_salmo', 'enfoque_tematico'],
      true);

    this.addPrompt('proverb', '1.0.0', 'Proverbio Bíblico',
      'Presenta Proverbios {capitulo}:{versiculo}. ' +
      'Incluye texto completo, contexto histórico y aplicación práctica actual. ' +
      'Tema: {tema_aplicacion}.',
      ['capitulo', 'versiculo', 'tema_aplicacion'],
      true);

    // Story templates
    this.addPrompt('bible_story', '1.0.0', 'Historia Bíblica',
      'Narra la historia de {personaje_o_evento} de {libro_biblico} {capitulo}. ' +
      'Estructura: Contexto, desarrollo, clímax, resolución, aplicación. ' +
      'Longitud: {longitud} palabras. Enfoque: {enfoque}.',
      ['personaje_o_evento', 'libro_biblico', 'capitulo', 'longitud', 'enfoque'],
      true);

    this.addPrompt('bible_character', '1.0.0', 'Personaje Bíblico',
      'Presenta perfil de {personaje}: genealogía, eventos clave, ' +
      'virtudes/defectos, lecciones para hoy. ' +
      'Referencias: {referencias_principales}. Longitud: {longitud} palabras.',
      ['personaje', 'referencias_principales', 'longitud'],
      true);

    this.addPrompt('parable', '1.0.0', 'Parábola de Jesús',
      'Explica la parábola de {nombre_parabola} ({referencia_evangelio}). ' +
      'Incluye: contexto histórico, significado original, aplicación actual. ' +
      'Longitud: {longitud} palabras.',
      ['nombre_parabola', 'referencia_evangelio', 'longitud'],
      true);

    // Reflection templates
    this.addPrompt('bible_reflection', '1.0.0', 'Reflexión Bíblica',
      'Reflexiona sobre {pasaje_biblico} ({referencia}). ' +
      'Estructura: Contexto, significado original, aplicación personal, oración. ' +
      'Tema: {tema_central}. Longitud: {longitud} palabras.',
      ['pasaje_biblico', 'referencia', 'tema_central', 'longitud'],
      true);

    this.addPrompt('christian_teaching', '1.0.0', 'Enseñanza Cristiana',
      'Desarrolla enseñanza sobre {tema_doctrinal} basada en {referencias_biblicas}. ' +
      'Incluye: fundamento bíblico, explicación, objeciones comunes, aplicación. ' +
      'Nivel: {nivel_profundidad}. Longitud: {longitud}.',
      ['tema_doctrinal', 'referencias_biblicas', 'nivel_profundidad', 'longitud'],
      true);

    this.addPrompt('christian_encouragement', '1.0.0', 'Ánimo Cristiano',
      'Genera palabra de ánimo para {situacion} usando {promesa_biblica}. ' +
      'Tono: compasivo, esperanzador, bíblico. Longitud: {longitud} palabras.',
      ['situacion', 'promesa_biblica', 'longitud'],
      true);
  }

  private addPrompt(
    contentType: string,
    version: string,
    title: string,
    template: string,
    variables: string[],
    isDefault: boolean
  ): void {
    const prompt: Prompt = {
      id: `${contentType}-${version}`,
      contentType,
      version,
      title,
      template,
      variables,
      isDefault,
    };

    if (!this.prompts.has(contentType)) {
      this.prompts.set(contentType, []);
    }
    this.prompts.get(contentType)!.push(prompt);
  }
}