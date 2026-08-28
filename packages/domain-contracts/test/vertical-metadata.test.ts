import { getVerticalMetadata, listVerticalIds, fetchVerticalMetadata, VerticalMetadataProvider } from '../src/vertical-metadata'

describe('FASE 15 Vertical Metadata (backend-provided navigation)', () => {
  test('both verticals expose the 16 required sections', () => {
    for (const id of ['christian', 'automotive']) {
      const meta = getVerticalMetadata(id)
      const ids = meta.nav.map((n) => n.id)
      for (const required of [
        'dashboard', 'projects', 'content', 'ideas', 'calendar', 'review', 'videos', 'media', 'templates',
        'social-accounts', 'publications', 'analytics', 'costs', 'settings', 'users', 'audit',
      ]) {
        expect(ids).toContain(required)
      }
      expect(meta.nav).toHaveLength(16)
    }
  })

  test('same nav shape across verticals; categories are vertical-specific and not hard-coded', async () => {
    const christian = getVerticalMetadata('christian')
    const automotive = getVerticalMetadata('automotive')

    expect(christian.nav.map((n) => n.id)).toEqual(automotive.nav.map((n) => n.id))
    expect(christian.contentCategories.map((c) => c.defaultLabel)).toEqual([
      'Oraciones', 'Versículos', 'Reflexiones', 'Biblia',
    ])
    expect(automotive.contentCategories.map((c) => c.defaultLabel)).toEqual([
      'Consejos', 'Mantenimiento', 'Diagnóstico', 'Fallas',
    ])
    expect(christian.contentCategories).not.toEqual(automotive.contentCategories)
  })

  test('listVerticalIds and fallbacks', () => {
    expect(listVerticalIds().sort()).toEqual(['automotive', 'christian'])
    expect(getVerticalMetadata('unknown').id).toBe('christian')
  })

  test('fetchVerticalMetadata resolves same as sync accessor', async () => {
    const sync = getVerticalMetadata('christian')
    const fetched = await fetchVerticalMetadata('christian')
    expect(fetched).toEqual(sync)
  })

  test('VerticalMetadataProvider caches', async () => {
    const provider = new VerticalMetadataProvider()
    const first = await provider.get('christian')
    const second = await provider.get('christian')
    expect(first).toBe(second)
    provider.clear()
    const third = await provider.get('christian')
    expect(third).toEqual(first)
    expect(third).not.toBe(first)
  })
})
