import { BIBLE_BOOKS, BIBLE_TOPICS, BIBLE_TRANSLATIONS, CHAPTER_VERSE_COUNTS, SAMPLE_BIBLE_VERSES } from './bible-data';
import { BibleParser } from './bible-parser';
import { BibleBook, BibleChapter, BibleReferenceValidationResult, BibleTopic, BibleTranslation, BibleVerse } from './bible-types';

export interface BibleEngineData {
  books?: BibleBook[];
  translations?: BibleTranslation[];
  verses?: BibleVerse[];
  topics?: BibleTopic[];
  chapterVerseCounts?: Record<string, number>;
}

export class BibleEngine {
  private readonly parser = new BibleParser();
  private readonly booksByAlias = new Map<string, BibleBook>();
  private readonly versesByChapter = new Map<string, BibleVerse[]>();
  private readonly chapterVerseCounts: Record<string, number>;

  readonly books: BibleBook[];
  readonly translations: BibleTranslation[];
  readonly topics: BibleTopic[];

  constructor(data: BibleEngineData = {}) {
    this.books = data.books ?? BIBLE_BOOKS;
    this.translations = data.translations ?? BIBLE_TRANSLATIONS;
    this.topics = data.topics ?? BIBLE_TOPICS;
    this.chapterVerseCounts = data.chapterVerseCounts ?? CHAPTER_VERSE_COUNTS;

    for (const book of this.books) {
      for (const name of [book.id, book.name, book.shortName, ...book.aliases]) {
        this.booksByAlias.set(this.parser.normalizeBookName(name), book);
      }
    }

    for (const verse of data.verses ?? SAMPLE_BIBLE_VERSES) {
      const key = this.chapterKey(verse.bookId, verse.chapter);
      const chapterVerses = this.versesByChapter.get(key) ?? [];
      chapterVerses.push(verse);
      this.versesByChapter.set(key, chapterVerses);
    }
  }

  validate(reference: string): BibleReferenceValidationResult {
    const parsed = this.parser.parse(reference);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parsed.book || !parsed.chapter || !parsed.verseStart) {
      errors.push(`Formato de referencia bíblica inválido: "${parsed.originalText}". Use "Libro capítulo:versículo".`);
      return { status: 'INVALID', errors, warnings, parsed };
    }

    const book = this.lookupBook(parsed.book);
    if (!book) {
      errors.push(`Libro bíblico inválido o desconocido: "${parsed.book}".`);
      warnings.push(`Formato de referencia bíblica no reconocido: "${parsed.originalText}".`);
      return { status: 'INVALID', errors, warnings, parsed };
    }

    if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
      errors.push(`Capítulo inválido: ${parsed.chapter} para ${book.name}. El libro tiene ${book.chapters} capítulos.`);
      return { status: 'INVALID', errors, warnings, parsed, book };
    }

    if (parsed.verseStart < 1 || (parsed.verseEnd !== undefined && parsed.verseEnd < parsed.verseStart)) {
      errors.push('El rango de versículos es inválido.');
      return { status: 'INVALID', errors, warnings, parsed, book };
    }

    const chapter = this.lookupChapter(book.id, parsed.chapter);
    if (chapter.verseCount > 0) {
      const requestedLastVerse = parsed.verseEnd ?? parsed.verseStart;
      if (requestedLastVerse > chapter.verseCount) {
        errors.push(`Versículo inválido: ${requestedLastVerse}. ${book.name} ${parsed.chapter} tiene ${chapter.verseCount} versículos.`);
      }
    } else {
      warnings.push(`No hay conteo de versículos cargado para ${book.name} ${parsed.chapter}; se requiere verificación de fuente.`);
    }

    const verses = this.lookupVerseRange(book.id, parsed.chapter, parsed.verseStart, parsed.verseEnd ?? parsed.verseStart);
    if (errors.length === 0 && verses.length === 0) {
      warnings.push(`El texto de ${book.name} ${parsed.chapter}:${parsed.verseStart}${parsed.verseEnd ? `-${parsed.verseEnd}` : ''} no está cargado en la fuente autorizada.`);
    }

    return {
      status: errors.length > 0 ? 'INVALID' : warnings.length > 0 ? 'WARNING' : 'VALID',
      errors,
      warnings,
      parsed,
      book,
      chapter,
      verses,
    };
  }

  lookupBook(name: string): BibleBook | undefined {
    return this.booksByAlias.get(this.parser.normalizeBookName(name));
  }

  lookupChapter(bookId: string, chapter: number): BibleChapter {
    return {
      bookId,
      chapter,
      verseCount: this.chapterVerseCounts[this.chapterKey(bookId, chapter)] ?? 0,
    };
  }

  lookupVerse(reference: string): BibleVerse | undefined {
    const validation = this.validate(reference);
    if (validation.status === 'INVALID' || !validation.parsed || !validation.book) {
      return undefined;
    }

    return this.lookupVerseRange(
      validation.book.id,
      validation.parsed.chapter,
      validation.parsed.verseStart as number,
      validation.parsed.verseStart as number,
    )[0];
  }

  lookupVerseRange(bookId: string, chapter: number, verseStart: number, verseEnd: number): BibleVerse[] {
    return (this.versesByChapter.get(this.chapterKey(bookId, chapter)) ?? []).filter(
      (verse) => verse.verse >= verseStart && verse.verse <= verseEnd,
    );
  }

  private chapterKey(bookId: string, chapter: number): string {
    return `${bookId}:${chapter}`;
  }
}
