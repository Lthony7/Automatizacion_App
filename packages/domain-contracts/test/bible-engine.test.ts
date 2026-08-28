import { BibleEngine } from '../src/bible-engine/bible-engine';
import { BibleGuard } from '../src/bible-engine/bible-guard';
import { ChristianRuleProvider } from '../src/christian-rule-provider';
import { ChristianValidator } from '../src/christian-validator';

describe('Bible Engine FASE 6', () => {
  const bibleEngine = new BibleEngine();
  const bibleGuard = new BibleGuard(bibleEngine);

  test('marks an invalid verse as INVALID', () => {
    expect(bibleGuard.validate('Mateo 7:99').status).toBe('INVALID');
  });

  test('marks a seeded public-domain verse as VALID', () => {
    const result = bibleGuard.validate('Juan 3:16');

    expect(result.status).toBe('VALID');
    expect(result.verses?.[0]?.text).toContain('amó Dios al mundo');
  });

  test('marks a nonexistent book as INVALID', () => {
    expect(bibleGuard.validate('LibroInexistente 3:16').status).toBe('INVALID');
  });

  test('marks a nonexistent chapter as INVALID', () => {
    expect(bibleGuard.validate('Mateo 99:1').status).toBe('INVALID');
  });

  test('prevents content with an invalid reference from advancing', () => {
    expect(bibleGuard.hasBlockingErrors(['Mateo 7:99'])).toBe(true);
    expect(bibleGuard.hasBlockingErrors(['Juan 3:16'])).toBe(false);
  });

  test('uses Bible Guard during Christian validation and state transitions', async () => {
    const content = {
      contentType: 'daily_verse',
      title: 'Versículo del día',
      body: 'Texto de prueba.',
      bibleReferences: ['Mateo 7:99'],
    };
    const validator = new ChristianValidator(bibleGuard);
    const ruleProvider = new ChristianRuleProvider(bibleGuard);

    expect((await validator.validate(content)).status).toBe('INVALID');
    await expect(ruleProvider.canTransition(content, 'VALIDATING', 'VALIDATED', {})).resolves.toBe(false);
  });
});
