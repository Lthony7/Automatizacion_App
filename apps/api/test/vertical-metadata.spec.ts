/*
 * Vertical Metadata Tests — FASE 9.6 (registerVerticalMetadata)
 * Covers: dynamic registration, validation, seed, get, list.
 */

import {
  registerVerticalMetadata,
  seedBuiltinVerticals,
  getVerticalMetadata,
  listVerticalIds,
  type VerticalMetadata,
} from 'domain-contracts/vertical-metadata';

function makeTestVertical(id: string): VerticalMetadata {
  return {
    id,
    displayName: `${id} Display`,
    tagline: `Tagline for ${id}`,
    nav: [
      { id: 'dashboard', labelKey: 'nav.dashboard', defaultLabel: 'Dashboard', href: '/', icon: 'layout-dashboard', group: 'primary', order: 1 },
    ],
    contentCategories: [
      { id: 'cat1', labelKey: 'cat.one', defaultLabel: 'Category One' },
    ],
  };
}

describe('Vertical Metadata (registerVerticalMetadata)', () => {
  beforeEach(() => {
    // Clear the internal map by re-seeding (idempotent)
    seedBuiltinVerticals();
  });

  describe('registerVerticalMetadata', () => {
    it('registers a new vertical', () => {
      registerVerticalMetadata(makeTestVertical('fitness'));
      const meta = getVerticalMetadata('fitness');
      expect(meta.id).toBe('fitness');
      expect(meta.displayName).toBe('fitness Display');
    });

    it('overwrites an existing vertical', () => {
      const v1 = makeTestVertical('fitness');
      v1.displayName = 'Version 1';
      registerVerticalMetadata(v1);

      const v2 = makeTestVertical('fitness');
      v2.displayName = 'Version 2';
      registerVerticalMetadata(v2);

      expect(getVerticalMetadata('fitness').displayName).toBe('Version 2');
    });

    it('throws on missing id', () => {
      expect(() => registerVerticalMetadata({ ...makeTestVertical(''), id: '' })).toThrow('id is required');
    });

    it('throws on missing displayName', () => {
      const v = makeTestVertical('test');
      v.displayName = '';
      expect(() => registerVerticalMetadata(v)).toThrow('displayName required');
    });

    it('throws on empty nav', () => {
      const v = makeTestVertical('test');
      v.nav = [];
      expect(() => registerVerticalMetadata(v)).toThrow('nav items required');
    });

    it('throws on empty contentCategories', () => {
      const v = makeTestVertical('test');
      v.contentCategories = [];
      expect(() => registerVerticalMetadata(v)).toThrow('contentCategories required');
    });
  });

  describe('seedBuiltinVerticals', () => {
    it('seeds christian and automotive', () => {
      seedBuiltinVerticals();
      expect(listVerticalIds()).toContain('christian');
      expect(listVerticalIds()).toContain('automotive');
    });

    it('is idempotent (does not overwrite)', () => {
      registerVerticalMetadata({ ...makeTestVertical('christian'), displayName: 'Custom BibleShorts' });
      seedBuiltinVerticals();
      // Custom value should persist since seed checks existence
      expect(getVerticalMetadata('christian').displayName).toBe('Custom BibleShorts');
    });
  });

  describe('getVerticalMetadata', () => {
    it('returns christian as default fallback', () => {
      const meta = getVerticalMetadata('nonexistent');
      expect(meta.id).toBe('christian');
    });

    it('returns exact match when registered', () => {
      registerVerticalMetadata(makeTestVertical('fitness'));
      expect(getVerticalMetadata('fitness').id).toBe('fitness');
    });
  });

  describe('listVerticalIds', () => {
    it('includes all registered verticals', () => {
      seedBuiltinVerticals();
      registerVerticalMetadata(makeTestVertical('fitness'));
      const ids = listVerticalIds();
      expect(ids).toContain('christian');
      expect(ids).toContain('automotive');
      expect(ids).toContain('fitness');
    });
  });
});
