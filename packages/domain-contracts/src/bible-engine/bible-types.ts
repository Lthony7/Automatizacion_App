/*
 * Bible Types - Content Automation Platform FASE 6
 * Core Bible data structures for the Christian Domain Bible Engine
 * Respects copyright and licensing of Bible translations
*/

/**
 * Bible Translation metadata
 * Only public domain translations can be included automatically
 * Protected translations require explicit licensing
*/
export interface BibleTranslation {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  languageCode: string;
  year: number;
  copyright: {
    status: 'public_domain' | 'copyrighted' | 'creative_commons' | 'unknown';
    holder?: string;
    licenseUrl?: string;
    allowsCommercialUse: boolean;
    requiresAttribution: boolean;
    maxVersesPerUse?: number;
  };
  description?: string;
  sourceUrl?: string;
  isDefault?: boolean;
}

/**
 * Bible Book metadata
*/
export interface BibleBook {
  id: string;
  name: string;
  shortName: string;
  testament: 'old' | 'new';
  order: number;
  chapters: number;
  testamentOrder: number;
  aliases: string[]; // Common abbreviations and variations
  testamentGroup?: string; // e.g., 'pentateuch', 'history', 'poetry', 'major_prophets', 'minor_prophets', 'gospels', 'epistles'
}

/**
 * Bible Chapter reference
*/
export interface BibleChapter {
  bookId: string;
  chapter: number;
  verseCount: number;
}

/**
 * Bible Verse
*/
export interface BibleVerse {
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  translationId: string;
  copyright?: {
    translationId: string;
    requiresAttribution: boolean;
    maxVersesPerUse?: number;
  };
}

/**
 * Bible Topic/Theme
*/
export interface BibleTopic {
  id: string;
  name: string;
  description: string;
  relatedVerses: string[]; // Array of verse references
  relatedTopics: string[];
}

/**
 * Parsed Bible Reference
*/
export interface ParsedBibleReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  isRange: boolean;
  originalText: string;
}

/**
 * Bible Reference Validation Result
*/
export interface BibleReferenceValidationResult {
  status: 'VALID' | 'WARNING' | 'INVALID';
  errors: string[];
  warnings: string[];
  parsed?: ParsedBibleReference;
  book?: BibleBook;
  chapter?: BibleChapter;
  verses?: BibleVerse[];
}

/**
 * Bible Engine Configuration
*/
export interface BibleEngineConfig {
  defaultTranslationId: string;
  allowedTranslations: string[]; // Translation IDs that can be used
  requireLicenseCheck: boolean;
  maxVersesPerRequest: number;
  defaultTranslation: BibleTranslation;
  availableTranslations: BibleTranslation[];
  books: BibleBook[];
}