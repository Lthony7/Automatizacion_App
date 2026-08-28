/*
 * Christian Knowledge Provider - Content Automation Platform FASE 5
 * Bible knowledge base for Christian content generation
 * Implements DomainKnowledgeProvider interface
*/

import { DomainKnowledgeProvider } from './domain.interface';

export class ChristianKnowledgeProvider implements DomainKnowledgeProvider {
  private bibleData: Map<string, any> = new Map();
  private verseIndex: Map<string, string[]> = new Map();

  constructor() {
    this.initializeBibleData();
  }

  async search(query: string, type?: string): Promise<any[]> {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search in Bible data
    for (const [key, data] of this.bibleData.entries()) {
      const searchableText = `${key} ${data.title || ''} ${data.content || ''}`.toLowerCase();
      if (searchableText.includes(lowerQuery)) {
        if (!type || data.type === type) {
          results.push({ ...data, reference: key });
        }
      }
    }

    // Sort by relevance (simple implementation)
    return results.slice(0, 20);
  }

  async getVerse(reference: string): Promise<any> {
    // Normalize reference (e.g., "Juan 3:16" -> "juan_3_16")
    const normalized = this.normalizeReference(reference);
    return this.bibleData.get(normalized) || null;
  }

  async getTechnicalTerm(term: string): Promise<any> {
    // For Christian domain, this would be theological terms
    const terms: Record<string, any> = {
      'trinity': {
        term: 'Trinidad',
        definition: 'Doctrina de un solo Dios en tres personas: Padre, Hijo y Espíritu Santo.',
        references: ['Mateo 28:19', '2 Corintios 13:14'],
      },
      'salvation': {
        term: 'Salvación',
        definition: 'Liberación del pecado y sus consecuencias mediante la fe en Jesucristo.',
        references: ['Juan 3:16', 'Romanos 10:9', 'Efesios 2:8-9'],
      },
      'grace': {
        term: 'Gracia',
        definition: 'Favor inmerecido de Dios hacia la humanidad.',
        references: ['Efesios 2:8', 'Romanos 3:24', 'Tito 2:11'],
      },
      'faith': {
        term: 'Fe',
        definition: 'Certeza de lo que se espera, convicción de lo que no se ve.',
        references: ['Hebreos 11:1', 'Romanos 10:17'],
      },
      'repentance': {
        term: 'Arrepentimiento',
        definition: 'Cambio de mente y corazón que lleva a apartarse del pecado.',
        references: ['Hechos 3:19', '2 Corintios 7:10'],
      },
    };

    return terms[term.toLowerCase()] || null;
  }

  private initializeBibleData(): void {
    // Key verses for content generation
    const keyVerses = [
      {
        reference: 'juan_3_16',
        book: 'Juan',
        chapter: 3,
        verse: 16,
        text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
        topics: ['amor', 'salvacion', 'vida_eterna', 'fe'],
      },
      {
        reference: 'filipenses_4_13',
        book: 'Filipenses',
        chapter: 4,
        verse: 13,
        text: 'Todo lo puedo en Cristo que me fortalece.',
        topics: ['fortaleza', 'cristo', 'poder'],
      },
      {
        reference: 'jeremias_29_11',
        book: 'Jeremías',
        chapter: 29,
        verse: 11,
        text: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',
        topics: ['esperanza', 'futuro', 'plan_dios', 'paz'],
      },
      {
        reference: 'salmo_23_1',
        book: 'Salmos',
        chapter: 23,
        verse: 1,
        text: 'Jehová es mi pastor; nada me faltará.',
        topics: ['provision', 'pastor', 'confianza'],
      },
      {
        reference: 'proverbios_3_5_6',
        book: 'Proverbios',
        chapter: 3,
        verseStart: 5,
        verseEnd: 6,
        text: 'Confía en Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.',
        topics: ['confianza', 'guia', 'sabiduria'],
      },
      {
        reference: 'romanoss_8_28',
        book: 'Romanos',
        chapter: 8,
        verse: 28,
        text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.',
        topics: ['proposito', 'amor_dios', 'bien'],
      },
      {
        reference: 'mateo_6_33',
        book: 'Mateo',
        chapter: 6,
        verse: 33,
        text: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.',
        topics: ['reino_dios', 'prioridades', 'provision'],
      },
      {
        reference: 'isaías_41_10',
        book: 'Isaías',
        chapter: 41,
        verse: 10,
        text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios; te esfuerzo, y te ayudo, y te sostengo con la diestra de mi justicia.',
        topics: ['fortaleza', 'miedo', 'presencia_dios', 'ayuda'],
      },
      {
        reference: '1_tesalonicenses_5_16_18',
        book: '1 Tesalonicenses',
        chapter: 5,
        verseStart: 16,
        verseEnd: 18,
        text: 'Estad siempre gozosos. Orad sin cesar. Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.',
        topics: ['gozo', 'oracion', 'gratitud', 'voluntad_dios'],
      },
      {
        reference: 'josue_1_9',
        book: 'Josué',
        chapter: 1,
        verse: 9,
        text: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.',
        topics: ['valentia', 'esfuerzo', 'presencia_dios', 'miedo'],
      },
    ];

    for (const verse of keyVerses) {
      const key = verse.reference;
      this.bibleData.set(key, {
        reference: verse.reference,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        verseStart: verse.verseStart,
        verseEnd: verse.verseEnd,
        text: verse.text,
        topics: verse.topics,
        type: 'verse',
      });

      // Index by topics
      for (const topic of verse.topics) {
        if (!this.verseIndex.has(topic)) {
          this.verseIndex.set(topic, []);
        }
        this.verseIndex.get(topic)!.push(verse.reference);
      }
    }

    // Add some stories
    this.bibleData.set('david_goliat', {
      title: 'David y Goliat',
      reference: '1 Samuel 17',
      type: 'story',
      characters: ['David', 'Goliat', 'Saúl'],
      summary: 'El joven David vence al gigante filisteo Goliat con una honda y una piedra, confiando en Dios.',
      themes: ['valentia', 'fe', 'victoria', 'dios_peleando'],
    });

    this.bibleData.set('hijo_prodigo', {
      title: 'El Hijo Pródigo',
      reference: 'Lucas 15:11-32',
      type: 'parable',
      characters: ['Padre', 'Hijo menor', 'Hijo mayor'],
      summary: 'Un hijo pide su herencia, la gasta, regresa arrepentido y es recibido con amor por el padre.',
      themes: ['arrepentimiento', 'perdon', 'amor_paterno', 'gracia'],
    });

    this.bibleData.set('daniel_leones', {
      title: 'Daniel en el Foso de los Leones',
      reference: 'Daniel 6',
      type: 'story',
      characters: ['Daniel', 'Dario', 'Leones'],
      summary: 'Daniel es echado al foso de los leones por orar a Dios, pero Dios cierra la boca de los leones.',
      themes: ['fidelidad', 'oracion', 'proteccion', 'milagro'],
    });
  }

  private normalizeReference(reference: string): string {
    return reference
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }
}