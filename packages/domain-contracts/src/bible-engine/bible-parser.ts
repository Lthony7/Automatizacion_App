import { ParsedBibleReference } from './bible-types';

export class BibleParser {
  parse(reference: string): ParsedBibleReference {
    const originalText = reference.trim();
    const standardMatch = originalText.match(/^(.+?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?(?:\s+\S+)?$/u);
    const compactMatch = originalText.match(/^(.+?)(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/u);
    const match = standardMatch ?? compactMatch;

    if (!match) {
      return {
        book: '',
        chapter: 0,
        isRange: false,
        originalText,
      };
    }

    const verseEnd = match[4] ? Number.parseInt(match[4], 10) : undefined;

    return {
      book: this.normalizeBookName(match[1]),
      chapter: Number.parseInt(match[2], 10),
      verseStart: Number.parseInt(match[3], 10),
      verseEnd,
      isRange: verseEnd !== undefined,
      originalText,
    };
  }

  normalizeBookName(book: string): string {
    return book
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }
}
