import { BibleBook, BibleTopic, BibleTranslation, BibleVerse } from './bible-types';

type BookSeed = [string, string, string, 'old' | 'new', number, string[]];

const BOOK_SEEDS: BookSeed[] = [
  ['genesis', 'Génesis', 'Gn', 'old', 50, ['Genesis', 'Gen']],
  ['exodo', 'Éxodo', 'Ex', 'old', 40, ['Exodo', 'Exodus']],
  ['levitico', 'Levítico', 'Lv', 'old', 27, ['Levitico', 'Leviticus', 'Lev']],
  ['numeros', 'Números', 'Nm', 'old', 36, ['Numeros', 'Numbers', 'Num']],
  ['deuteronomio', 'Deuteronomio', 'Dt', 'old', 34, ['Deuteronomy', 'Deut']],
  ['josue', 'Josué', 'Jos', 'old', 24, ['Josue', 'Joshua']],
  ['jueces', 'Jueces', 'Jue', 'old', 21, ['Judges', 'Jdg']],
  ['rut', 'Rut', 'Rt', 'old', 4, ['Ruth']],
  ['1samuel', '1 Samuel', '1 S', 'old', 31, ['1 Samuel', '1Sam', '1 Sa']],
  ['2samuel', '2 Samuel', '2 S', 'old', 24, ['2 Samuel', '2Sam', '2 Sa']],
  ['1reyes', '1 Reyes', '1 R', 'old', 22, ['1 Kings', '1Kgs']],
  ['2reyes', '2 Reyes', '2 R', 'old', 25, ['2 Kings', '2Kgs']],
  ['1cronicas', '1 Crónicas', '1 Cr', 'old', 29, ['1 Cronicas', '1 Chronicles', '1Chr']],
  ['2cronicas', '2 Crónicas', '2 Cr', 'old', 36, ['2 Cronicas', '2 Chronicles', '2Chr']],
  ['esdras', 'Esdras', 'Esd', 'old', 10, ['Ezra']],
  ['nehemias', 'Nehemías', 'Neh', 'old', 13, ['Nehemiah']],
  ['ester', 'Ester', 'Est', 'old', 10, ['Esther']],
  ['job', 'Job', 'Job', 'old', 42, []],
  ['salmos', 'Salmos', 'Sal', 'old', 150, ['Psalms', 'Psalm', 'Ps']],
  ['proverbios', 'Proverbios', 'Pr', 'old', 31, ['Proverbs', 'Prov']],
  ['eclesiastes', 'Eclesiastés', 'Ec', 'old', 12, ['Ecclesiastes', 'Ecc']],
  ['cantares', 'Cantar de los Cantares', 'Cnt', 'old', 8, ['Cantares', 'Song of Solomon', 'Song']],
  ['isaias', 'Isaías', 'Is', 'old', 66, ['Isaias', 'Isaiah']],
  ['jeremias', 'Jeremías', 'Jer', 'old', 52, ['Jeremiah']],
  ['lamentaciones', 'Lamentaciones', 'Lm', 'old', 5, ['Lamentations', 'Lam']],
  ['ezequiel', 'Ezequiel', 'Ez', 'old', 48, ['Ezekiel', 'Eze']],
  ['daniel', 'Daniel', 'Dn', 'old', 12, ['Dan']],
  ['oseas', 'Oseas', 'Os', 'old', 14, ['Hosea', 'Hos']],
  ['joel', 'Joel', 'Jl', 'old', 3, []],
  ['amos', 'Amós', 'Am', 'old', 9, ['Amos']],
  ['abdias', 'Abdías', 'Abd', 'old', 1, ['Abdias', 'Obadiah', 'Obad']],
  ['jonas', 'Jonás', 'Jon', 'old', 4, ['Jonas', 'Jonah']],
  ['miqueas', 'Miqueas', 'Mi', 'old', 7, ['Micah']],
  ['nahum', 'Nahúm', 'Nah', 'old', 3, ['Nahum']],
  ['habacuc', 'Habacuc', 'Hab', 'old', 3, ['Habakkuk']],
  ['sofonias', 'Sofonías', 'Sof', 'old', 3, ['Sofonias', 'Zephaniah', 'Zeph']],
  ['ageo', 'Ageo', 'Ag', 'old', 2, ['Haggai', 'Hag']],
  ['zacarias', 'Zacarías', 'Zac', 'old', 14, ['Zacarias', 'Zechariah', 'Zech']],
  ['malaquias', 'Malaquías', 'Mal', 'old', 4, ['Malaquias', 'Malachi']],
  ['mateo', 'Mateo', 'Mt', 'new', 28, ['Matthew', 'Matt']],
  ['marcos', 'Marcos', 'Mr', 'new', 16, ['Mark', 'Mk']],
  ['lucas', 'Lucas', 'Lc', 'new', 24, ['Luke', 'Lk']],
  ['juan', 'Juan', 'Jn', 'new', 21, ['John']],
  ['hechos', 'Hechos', 'Hch', 'new', 28, ['Acts', 'Act']],
  ['romanos', 'Romanos', 'Ro', 'new', 16, ['Romans', 'Rom']],
  ['1corintios', '1 Corintios', '1 Co', 'new', 16, ['1 Corinthians', '1Cor']],
  ['2corintios', '2 Corintios', '2 Co', 'new', 13, ['2 Corinthians', '2Cor']],
  ['galatas', 'Gálatas', 'Gá', 'new', 6, ['Galatas', 'Galatians', 'Gal']],
  ['efesios', 'Efesios', 'Ef', 'new', 6, ['Ephesians', 'Eph']],
  ['filipenses', 'Filipenses', 'Fil', 'new', 4, ['Philippians', 'Phil']],
  ['colosenses', 'Colosenses', 'Col', 'new', 4, ['Colossians']],
  ['1tesalonicenses', '1 Tesalonicenses', '1 Ts', 'new', 5, ['1 Thessalonians', '1Thess']],
  ['2tesalonicenses', '2 Tesalonicenses', '2 Ts', 'new', 3, ['2 Thessalonians', '2Thess']],
  ['1timoteo', '1 Timoteo', '1 Ti', 'new', 6, ['1 Timothy', '1Tim']],
  ['2timoteo', '2 Timoteo', '2 Ti', 'new', 4, ['2 Timothy', '2Tim']],
  ['tito', 'Tito', 'Tit', 'new', 3, ['Titus']],
  ['filemon', 'Filemón', 'Flm', 'new', 1, ['Filemon', 'Philemon', 'Phm']],
  ['hebreos', 'Hebreos', 'Heb', 'new', 13, ['Hebrews']],
  ['santiago', 'Santiago', 'Stg', 'new', 5, ['James', 'Jas']],
  ['1pedro', '1 Pedro', '1 P', 'new', 5, ['1 Peter', '1Pet']],
  ['2pedro', '2 Pedro', '2 P', 'new', 3, ['2 Peter', '2Pet']],
  ['1juan', '1 Juan', '1 Jn', 'new', 5, ['1 John', '1Jn']],
  ['2juan', '2 Juan', '2 Jn', 'new', 1, ['2 John', '2Jn']],
  ['3juan', '3 Juan', '3 Jn', 'new', 1, ['3 John', '3Jn']],
  ['judas', 'Judas', 'Jud', 'new', 1, ['Jude']],
  ['apocalipsis', 'Apocalipsis', 'Ap', 'new', 22, ['Revelation', 'Rev']],
];

export const BIBLE_BOOKS: BibleBook[] = BOOK_SEEDS.map(([id, name, shortName, testament, chapters, aliases], index) => ({
  id,
  name,
  shortName,
  testament,
  order: index + 1,
  testamentOrder: testament === 'old' ? index + 1 : index - 38,
  chapters,
  aliases,
}));

export const RVR_1909_TRANSLATION: BibleTranslation = {
  id: 'rvr1909',
  name: 'Reina-Valera 1909',
  abbreviation: 'RVR1909',
  language: 'Spanish',
  languageCode: 'es',
  year: 1909,
  copyright: {
    status: 'public_domain',
    allowsCommercialUse: true,
    requiresAttribution: false,
  },
  sourceUrl: 'https://ebible.org/spaRV1909/',
  isDefault: true,
};

export const BIBLE_TRANSLATIONS: BibleTranslation[] = [RVR_1909_TRANSLATION];

// Minimal public-domain RVR 1909 seed. Production verse text must be imported
// from a verified public-domain or licensed source before automatic inclusion.
export const SAMPLE_BIBLE_VERSES: BibleVerse[] = [
  { bookId: 'juan', chapter: 1, verse: 1, text: 'EN el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.', translationId: 'rvr1909' },
  { bookId: 'juan', chapter: 3, verse: 16, text: 'Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.', translationId: 'rvr1909' },
  { bookId: 'salmos', chapter: 23, verse: 1, text: 'JEHOVA es mi pastor; nada me faltará.', translationId: 'rvr1909' },
];

export const CHAPTER_VERSE_COUNTS: Record<string, number> = {
  'juan:1': 51,
  'juan:3': 36,
  'mateo:7': 29,
  'salmos:23': 6,
};

export const BIBLE_TOPICS: BibleTopic[] = [
  { id: 'amor', name: 'Amor', description: 'El amor de Dios y el amor al prójimo.', relatedVerses: ['Juan 3:16'], relatedTopics: ['fe', 'esperanza'] },
  { id: 'fe', name: 'Fe', description: 'Confianza en Dios y en sus promesas.', relatedVerses: ['Juan 3:16'], relatedTopics: ['amor', 'esperanza'] },
  { id: 'provision', name: 'Provisión', description: 'El cuidado de Dios para su pueblo.', relatedVerses: ['Salmos 23:1'], relatedTopics: ['esperanza'] },
];
