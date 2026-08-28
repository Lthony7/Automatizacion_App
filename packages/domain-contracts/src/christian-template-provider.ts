/*
 * Christian Template Provider - Content Automation Platform FASE 5
 * Video/Audio/Text templates for Christian content
 * Implements DomainTemplateProvider interface
*/

import { DomainTemplateProvider } from './domain.interface';

export class ChristianTemplateProvider implements DomainTemplateProvider {
  private templates: Map<string, any[]> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  async getTemplates(contentType: string): Promise<any[]> {
    return this.templates.get(contentType) || [];
  }

  async getTemplate(contentType: string, variant?: string): Promise<any> {
    const templates = this.templates.get(contentType) || [];
    if (variant) {
      return templates.find(t => t.variant === variant) || templates[0];
    }
    return templates[0];
  }

  async validateTemplate(template: any): Promise<'VALID' | 'INVALID'> {
    if (!template.id || !template.contentType || !template.layout) {
      return 'INVALID';
    }
    // Christian-specific validation
    if (template.contentType && template.contentType.endsWith('_prayer')) {
      if (!template.layout.includes('prayer_structure')) {
        return 'INVALID';
      }
    }
    return 'VALID';
  }

  private initializeDefaultTemplates(): void {
    // Prayer video templates
    this.addTemplate('morning_prayer', 'default', {
      id: 'morning_prayer_default',
      name: 'OraciÃƒÂ³n Matutina EstÃƒÂ¡ndar',
      contentType: 'morning_prayer',
      variant: 'default',
      layout: {
        structure: 'prayer_structure',
        sections: [
          { type: 'title', content: '{title}', style: 'prayer_title' },
          { type: 'opening', content: '{opening}', style: 'prayer_opening' },
          { type: 'praise', content: '{praise_section}', style: 'prayer_praise' },
          { type: 'petition', content: '{petition}', style: 'prayer_petition' },
          { type: 'thanksgiving', content: '{thanksgiving}', style: 'prayer_thanksgiving' },
          { type: 'closing', content: '{closing}', style: 'prayer_closing' },
          { type: 'bible_reference', content: '{bible_ref}', style: 'bible_ref', optional: true },
        ],
      },
      visualStyle: {
        background: 'dawn_light',
        colorScheme: 'warm_morning',
        font: 'elegant_serif',
        animation: 'gentle_fade',
      },
      audio: {
        backgroundMusic: 'soft_piano_dawn',
        voiceProfile: 'calm_male',
      },
      duration: 180,
    });

    this.addTemplate('night_prayer', 'default', {
      id: 'night_prayer_default',
      name: 'OraciÃƒÂ³n Nocturna EstÃƒÂ¡ndar',
      contentType: 'night_prayer',
      variant: 'default',
      layout: {
        structure: 'prayer_structure',
        sections: [
          { type: 'title', content: '{title}', style: 'prayer_title' },
          { type: 'invocation', content: '{invocation}', style: 'prayer_opening' },
          { type: 'examination', content: '{examination}', style: 'prayer_examination' },
          { type: 'forgiveness', content: '{forgiveness}', style: 'prayer_forgiveness' },
          { type: 'commendation', content: '{commendation}', style: 'prayer_commendation' },
          { type: 'peace', content: '{peace}', style: 'prayer_peace' },
        ],
      },
      visualStyle: {
        background: 'starry_night',
        colorScheme: 'deep_blue_peaceful',
        font: 'gentle_serif',
        animation: 'slow_fade',
      },
      audio: {
        backgroundMusic: 'ambient_night_piano',
        voiceProfile: 'soft_female',
      },
      duration: 180,
    });

    // Verse templates
    this.addTemplate('daily_verse', 'default', {
      id: 'daily_verse_default',
      name: 'VersÃƒÂ­culo del DÃƒÂ­a EstÃƒÂ¡ndar',
      contentType: 'daily_verse',
      variant: 'default',
      layout: {
        structure: 'verse_display',
        sections: [
          { type: 'date', content: '{date}', style: 'verse_date' },
          { type: 'reference', content: '{reference}', style: 'verse_reference' },
          { type: 'text', content: '{text}', style: 'verse_text' },
          { type: 'reflection', content: '{reflection}', style: 'verse_reflection', optional: true },
          { type: 'prayer', content: '{prayer}', style: 'verse_prayer', optional: true },
        ],
      },
      visualStyle: {
        background: 'parchment_texture',
        colorScheme: 'sepia_gold',
        font: 'classic_serif',
        animation: 'scroll_reveal',
      },
      audio: {
        backgroundMusic: 'gentle_harp',
        voiceProfile: 'clear_male',
      },
      duration: 120,
    });

    this.addTemplate('psalm', 'default', {
      id: 'psalm_default',
      name: 'Salmo Completo',
      contentType: 'psalm',
      variant: 'default',
      layout: {
        structure: 'psalm_display',
        sections: [
          { type: 'title', content: 'Salmo {number}', style: 'psalm_title' },
          { type: 'introduction', content: '{introduction}', style: 'psalm_intro', optional: true },
          { type: 'verses', content: '{verses}', style: 'psalm_verses' },
          { type: 'reflection', content: '{reflection}', style: 'psalm_reflection', optional: true },
        ],
      },
      visualStyle: {
        background: 'ancient_scroll',
        colorScheme: 'deep_earth_tones',
        font: 'hebrew_inspired_serif',
        animation: 'unfolding_scroll',
      },
      duration: 240,
    });

    this.addTemplate('proverb', 'default', {
      id: 'proverb_default',
      name: 'Proverbio Diario',
      contentType: 'proverb',
      variant: 'default',
      layout: {
        structure: 'proverb_display',
        sections: [
          { type: 'reference', content: 'Proverbios {chapter}:{verse}', style: 'proverb_ref' },
          { type: 'text', content: '{text}', style: 'proverb_text' },
          { type: 'application', content: '{application}', style: 'proverb_application' },
        ],
      },
      visualStyle: {
        background: 'wisdom_background',
        colorScheme: 'gold_blue_wisdom',
        font: 'clean_sans',
        animation: 'fade_in',
      },
      duration: 120,
    });

    // Story templates
    this.addTemplate('bible_story', 'default', {
      id: 'bible_story_default',
      name: 'Historia BÃƒÂ­blica Narrativa',
      contentType: 'bible_story',
      variant: 'default',
      layout: {
        structure: 'story_narrative',
        sections: [
          { type: 'title', content: '{title}', style: 'story_title' },
          { type: 'setting', content: '{setting}', style: 'story_setting' },
          { type: 'characters', content: '{characters}', style: 'story_characters' },
          { type: 'plot', content: '{plot}', style: 'story_plot' },
          { type: 'climax', content: '{climax}', style: 'story_climax' },
          { type: 'resolution', content: '{resolution}', style: 'story_resolution' },
          { type: 'lesson', content: '{lesson}', style: 'story_lesson' },
        ],
      },
      visualStyle: {
        background: 'biblical_landscape',
        colorScheme: 'earth_tones',
        font: 'storybook_serif',
        animation: 'page_turn',
      },
      duration: 300,
    });

    this.addTemplate('parable', 'default', {
      id: 'parable_default',
      name: 'ParÃƒÂ¡bola Ilustrada',
      contentType: 'parable',
      variant: 'default',
      layout: {
        structure: 'parable_explanation',
        sections: [
          { type: 'title', content: 'ParÃƒÂ¡bola de {title}', style: 'parable_title' },
          { type: 'context', content: '{context}', style: 'parable_context' },
          { type: 'story', content: '{story_text}', style: 'parable_story' },
          { type: 'meaning', content: '{meaning}', style: 'parable_meaning' },
          { type: 'application', content: '{application}', style: 'parable_application' },
        ],
      },
      visualStyle: {
        background: 'galilee_shore',
        colorScheme: 'mediterranean_blue_white',
        font: 'parable_font',
        animation: 'wave_reveal',
      },
      duration: 240,
    });

    // Reflection/Teaching templates
    this.addTemplate('bible_reflection', 'default', {
      id: 'bible_reflection_default',
      name: 'ReflexiÃƒÂ³n BÃƒÂ­blica Profunda',
      contentType: 'bible_reflection',
      variant: 'default',
      layout: {
        structure: 'reflection_structure',
        sections: [
          { type: 'passage', content: '{passage}', style: 'reflection_passage' },
          { type: 'context', content: '{historical_context}', style: 'reflection_context' },
          { type: 'exegesis', content: '{exegesis}', style: 'reflection_exegesis' },
          { type: 'application', content: '{personal_application}', style: 'reflection_application' },
          { type: 'prayer', content: '{closing_prayer}', style: 'reflection_prayer' },
        ],
      },
      visualStyle: {
        background: 'quiet_study',
        colorScheme: 'muted_warm',
        font: 'reflective_serif',
        animation: 'slow_fade_in',
      },
      duration: 240,
    });

    this.addTemplate('christian_teaching', 'default', {
      id: 'christian_teaching_default',
      name: 'EnseÃƒÂ±anza Doctrinal',
      contentType: 'christian_teaching',
      variant: 'default',
      layout: {
        structure: 'teaching_structure',
        sections: [
          { type: 'topic', content: '{topic}', style: 'teaching_topic' },
          { type: 'scripture', content: '{scripture_foundation}', style: 'teaching_scripture' },
          { type: 'explanation', content: '{explanation}', style: 'teaching_explanation' },
          { type: 'objections', content: '{common_objections}', style: 'teaching_objections', optional: true },
          { type: 'application', content: '{practical_application}', style: 'teaching_application' },
        ],
      },
      visualStyle: {
        background: 'classroom_setting',
        colorScheme: 'academic_blue_white',
        font: 'academic_serif',
        animation: 'slide_reveal',
      },
      duration: 300,
    });

    this.addTemplate('christian_encouragement', 'default', {
      id: 'christian_encouragement_default',
      name: 'Palabra de ÃƒÂnimo',
      contentType: 'christian_encouragement',
      variant: 'default',
      layout: {
        structure: 'encouragement_card',
        sections: [
          { type: 'verse', content: '{anchor_verse}', style: 'encouragement_verse' },
          { type: 'message', content: '{encouragement_message}', style: 'encouragement_message' },
          { type: 'action', content: '{practical_step}', style: 'encouragement_action' },
        ],
      },
      visualStyle: {
        background: 'sunrise_hope',
        colorScheme: 'hopeful_bright',
        font: 'uplifting_sans',
        animation: 'rise_up',
      },
      duration: 180,
    });
  }

  private addTemplate(contentType: string, variant: string, template: any): void {
    if (!this.templates.has(contentType)) {
      this.templates.set(contentType, []);
    }
    this.templates.get(contentType)!.push({ ...template, variant });
  }
}