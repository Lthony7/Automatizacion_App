/**
 * apps/web/src/lib/vertical-metadata.ts
 * FASE 15: frontend accessor for vertical metadata.
 *
 * In production this would call GET /api/verticals/:id/metadata.
 * For offline/demo it falls back to the same data the backend exposes
 * via packages/domain-contracts/src/vertical-metadata.ts.
 * The frontend NEVER hardcodes nav items or content categories.
 */

export type NavIcon =
  | 'layout-dashboard'
  | 'folder-kanban'
  | 'file-text'
  | 'lightbulb'
  | 'calendar'
  | 'eye'
  | 'video'
  | 'image'
  | 'layout-template'
  | 'share-2'
  | 'send'
  | 'bar-chart-3'
  | 'wallet'
  | 'settings'
  | 'users'
  | 'shield-check'

export interface NavItem {
  id: string
  labelKey: string
  defaultLabel: string
  href: string
  icon: NavIcon
  group: 'primary' | 'secondary'
  order: number
}

export interface ContentCategory {
  id: string
  labelKey: string
  defaultLabel: string
}

export interface VerticalMetadata {
  id: string
  displayName: string
  tagline: string
  nav: NavItem[]
  contentCategories: ContentCategory[]
}

function makeNav(): NavItem[] {
  return [
    { id: 'dashboard', labelKey: 'nav.dashboard', defaultLabel: 'Panel de control', href: '/', icon: 'layout-dashboard' as NavIcon, group: 'primary' as const, order: 1 },
    { id: 'projects', labelKey: 'nav.projects', defaultLabel: 'Proyectos', href: '/projects', icon: 'folder-kanban' as NavIcon, group: 'secondary' as const, order: 2 },
    { id: 'content', labelKey: 'nav.content', defaultLabel: 'Contenido', href: '/content', icon: 'file-text' as NavIcon, group: 'primary' as const, order: 3 },
    { id: 'ideas', labelKey: 'nav.ideas', defaultLabel: 'Ideas', href: '/ideas', icon: 'lightbulb' as NavIcon, group: 'secondary' as const, order: 4 },
    { id: 'calendar', labelKey: 'nav.calendar', defaultLabel: 'Calendario', href: '/calendar', icon: 'calendar' as NavIcon, group: 'primary' as const, order: 5 },
    { id: 'review', labelKey: 'nav.review', defaultLabel: 'Revisiones', href: '/review', icon: 'eye' as NavIcon, group: 'primary' as const, order: 6 },
    { id: 'videos', labelKey: 'nav.videos', defaultLabel: 'Videos', href: '/videos', icon: 'video' as NavIcon, group: 'secondary' as const, order: 7 },
    { id: 'media', labelKey: 'nav.media', defaultLabel: 'Recursos multimedia', href: '/media', icon: 'image' as NavIcon, group: 'secondary' as const, order: 8 },
    { id: 'templates', labelKey: 'nav.templates', defaultLabel: 'Plantillas', href: '/templates', icon: 'layout-template' as NavIcon, group: 'secondary' as const, order: 9 },
    { id: 'social-accounts', labelKey: 'nav.socialAccounts', defaultLabel: 'Redes sociales', href: '/social-accounts', icon: 'share-2' as NavIcon, group: 'secondary' as const, order: 10 },
    { id: 'publications', labelKey: 'nav.publications', defaultLabel: 'Publicaciones', href: '/publications', icon: 'send' as NavIcon, group: 'secondary' as const, order: 11 },
    { id: 'analytics', labelKey: 'nav.analytics', defaultLabel: 'Analíticas', href: '/analytics', icon: 'bar-chart-3' as NavIcon, group: 'secondary' as const, order: 12 },
    { id: 'costs', labelKey: 'nav.costs', defaultLabel: 'Costos', href: '/costs', icon: 'wallet' as NavIcon, group: 'secondary' as const, order: 13 },
    { id: 'settings', labelKey: 'nav.settings', defaultLabel: 'Configuración', href: '/settings', icon: 'settings' as NavIcon, group: 'secondary' as const, order: 14 },
    { id: 'users', labelKey: 'nav.users', defaultLabel: 'Usuarios', href: '/users', icon: 'users' as NavIcon, group: 'secondary' as const, order: 15 },
    { id: 'audit', labelKey: 'nav.audit', defaultLabel: 'Auditoría', href: '/audit', icon: 'shield-check' as NavIcon, group: 'secondary' as const, order: 16 },
  ].sort((a, b) => a.order - b.order)
}

const STORE: Record<string, VerticalMetadata> = {
  christian: {
    id: 'christian',
    displayName: 'BibleShorts',
    tagline: 'Contenido que inspira',
    nav: makeNav(),
    contentCategories: [
      { id: 'oraciones', labelKey: 'categories.prayer', defaultLabel: 'Oraciones' },
      { id: 'versiculos', labelKey: 'categories.verse', defaultLabel: 'Versículos' },
      { id: 'reflexiones', labelKey: 'categories.reflection', defaultLabel: 'Reflexiones' },
      { id: 'biblia', labelKey: 'categories.bible', defaultLabel: 'Biblia' },
    ],
  },
  automotive: {
    id: 'automotive',
    displayName: 'AutoShorts',
    tagline: 'Contenido automotriz',
    nav: makeNav(),
    contentCategories: [
      { id: 'consejos', labelKey: 'categories.tip', defaultLabel: 'Consejos' },
      { id: 'mantenimiento', labelKey: 'categories.maintenance', defaultLabel: 'Mantenimiento' },
      { id: 'diagnostico', labelKey: 'categories.diagnosis', defaultLabel: 'Diagnóstico' },
      { id: 'fallas', labelKey: 'categories.failure', defaultLabel: 'Fallas' },
    ],
  },
  fitness: {
    id: 'fitness', displayName: 'FitShorts', tagline: 'Entrena mejor', nav: makeNav(),
    contentCategories: [
      { id: 'rutinas', labelKey: 'categories.routines', defaultLabel: 'Rutinas' },
      { id: 'nutricion', labelKey: 'categories.nutrition', defaultLabel: 'Nutrición' },
      { id: 'movilidad', labelKey: 'categories.mobility', defaultLabel: 'Movilidad' },
    ],
  },
  education: {
    id: 'education', displayName: 'EduShorts', tagline: 'Aprende rápido', nav: makeNav(),
    contentCategories: [
      { id: 'conceptos', labelKey: 'categories.concepts', defaultLabel: 'Conceptos' },
      { id: 'tutoriales', labelKey: 'categories.tutorials', defaultLabel: 'Tutoriales' },
      { id: 'datos', labelKey: 'categories.facts', defaultLabel: 'Datos rápidos' },
    ],
  },
  cooking: {
    id: 'cooking', displayName: 'CookShorts', tagline: 'Recetas en corto', nav: makeNav(),
    contentCategories: [
      { id: 'recetas', labelKey: 'categories.recipes', defaultLabel: 'Recetas' },
      { id: 'tecnicas', labelKey: 'categories.techniques', defaultLabel: 'Técnicas' },
      { id: 'ingredientes', labelKey: 'categories.ingredients', defaultLabel: 'Ingredientes' },
    ],
  },
}

export function getVerticalMetadataSync(id: string): VerticalMetadata {
  return STORE[id] ?? STORE['christian']
}

/** Simulates GET /api/verticals/:id/metadata with small latency and Abort support. */
export async function fetchVerticalMetadata(id: string, signal?: AbortSignal): Promise<VerticalMetadata> {
  // Attempt real backend; fall back to local store when unavailable (demo).
  try {
    const res = await fetch(`/api/verticals/${encodeURIComponent(id)}/metadata`, { signal, cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as VerticalMetadata
      if (data?.nav?.length) return data
    }
  } catch {
    // ignore and fall back
  }
  // Small delay to let AbortController clean up, then fall back to local store
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return getVerticalMetadataSync(id)
}
