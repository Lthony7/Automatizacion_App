/**
 * FASE 15 + FASE 9.6 hardening: Vertical Metadata
 *
 * GENERIC by design:
 *  - No vertical-specific services exist.
 *  - Navigation and content categories are defined only in the metadata map
 *    on the backend (this module). The frontend never hardcodes nav items
 *    or labels; it fetches them via the provider.
 *
 * FASE 9.6: VERTICAL_METADATA_MAP is no longer a const literal.
 * Use registerVerticalMetadata() to add verticals at boot time without
 * modifying this file. The christian/automotive entries are registered
 * via the domain providers (ChristianDomainProvider, AutomotiveDomainProvider).
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
  | 'shield-check';

export interface NavItem {
  id: string;
  labelKey: string;
  defaultLabel: string;
  href: string;
  icon: NavIcon;
  group: 'primary' | 'secondary';
  order: number;
}

export interface ContentCategory {
  id: string;
  labelKey: string;
  defaultLabel: string;
}

export interface VerticalMetadata {
  id: string;
  displayName: string;
  tagline: string;
  nav: NavItem[];
  contentCategories: ContentCategory[];
}

/** Ordering follows spec: Dashboard, Projects, Content, Ideas, Calendar, Review,
 *  Videos, Media, Templates, Social Accounts, Publications, Analytics, Costs,
 *  Settings, Users, Audit. First 4 are primary (mobile bottom nav), rest secondary. */
function makeNav(): NavItem[] {
  const items: NavItem[] = [
    { id: 'dashboard', labelKey: 'nav.dashboard', defaultLabel: 'Dashboard', href: '/', icon: 'layout-dashboard', group: 'primary', order: 1 },
    { id: 'projects', labelKey: 'nav.projects', defaultLabel: 'Projects', href: '/projects', icon: 'folder-kanban', group: 'secondary', order: 2 },
    { id: 'content', labelKey: 'nav.content', defaultLabel: 'Content', href: '/content', icon: 'file-text', group: 'primary', order: 3 },
    { id: 'ideas', labelKey: 'nav.ideas', defaultLabel: 'Ideas', href: '/ideas', icon: 'lightbulb', group: 'secondary', order: 4 },
    { id: 'calendar', labelKey: 'nav.calendar', defaultLabel: 'Calendar', href: '/calendar', icon: 'calendar', group: 'primary', order: 5 },
    { id: 'review', labelKey: 'nav.review', defaultLabel: 'Review', href: '/review', icon: 'eye', group: 'primary', order: 6 },
    { id: 'videos', labelKey: 'nav.videos', defaultLabel: 'Videos', href: '/videos', icon: 'video', group: 'secondary', order: 7 },
    { id: 'media', labelKey: 'nav.media', defaultLabel: 'Media', href: '/media', icon: 'image', group: 'secondary', order: 8 },
    { id: 'templates', labelKey: 'nav.templates', defaultLabel: 'Templates', href: '/templates', icon: 'layout-template', group: 'secondary', order: 9 },
    { id: 'social-accounts', labelKey: 'nav.socialAccounts', defaultLabel: 'Social Accounts', href: '/social-accounts', icon: 'share-2', group: 'secondary', order: 10 },
    { id: 'publications', labelKey: 'nav.publications', defaultLabel: 'Publications', href: '/publications', icon: 'send', group: 'secondary', order: 11 },
    { id: 'analytics', labelKey: 'nav.analytics', defaultLabel: 'Analytics', href: '/analytics', icon: 'bar-chart-3', group: 'secondary', order: 12 },
    { id: 'costs', labelKey: 'nav.costs', defaultLabel: 'Costs', href: '/costs', icon: 'wallet', group: 'secondary', order: 13 },
    { id: 'settings', labelKey: 'nav.settings', defaultLabel: 'Settings', href: '/settings', icon: 'settings', group: 'secondary', order: 14 },
    { id: 'users', labelKey: 'nav.users', defaultLabel: 'Users', href: '/users', icon: 'users', group: 'secondary', order: 15 },
    { id: 'audit', labelKey: 'nav.audit', defaultLabel: 'Audit', href: '/audit', icon: 'shield-check', group: 'secondary', order: 16 },
  ];
  return [...items].sort((a, b) => a.order - b.order);
}

/** Mutable map — entries added at boot via registerVerticalMetadata(). */
const VERTICAL_METADATA_MAP: Record<string, VerticalMetadata> = {};

const DEFAULT_VERTICAL = 'christian';

/**
 * Register (or overwrite) vertical metadata at boot time.
 * Call this from the domain provider initialization so adding a vertical
 * never requires modifying this file.
 *
 * @throws if metadata is missing required fields (id, displayName, nav, contentCategories)
 */
export function registerVerticalMetadata(metadata: VerticalMetadata): void {
  if (!metadata.id || typeof metadata.id !== 'string') {
    throw new Error('registerVerticalMetadata: id is required');
  }
  if (!metadata.displayName) {
    throw new Error(`registerVerticalMetadata: displayName required for "${metadata.id}"`);
  }
  if (!Array.isArray(metadata.nav) || metadata.nav.length === 0) {
    throw new Error(`registerVerticalMetadata: nav items required for "${metadata.id}"`);
  }
  if (!Array.isArray(metadata.contentCategories) || metadata.contentCategories.length === 0) {
    throw new Error(`registerVerticalMetadata: contentCategories required for "${metadata.id}"`);
  }
  VERTICAL_METADATA_MAP[metadata.id] = metadata;
}

/** Seed built-in verticals (called once at module init). */
export function seedBuiltinVerticals(): void {
  if (VERTICAL_METADATA_MAP['christian']) return; // already seeded

  registerVerticalMetadata({
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
  });

  registerVerticalMetadata({
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
  });
}

export function getVerticalMetadata(verticalId: string): VerticalMetadata {
  return VERTICAL_METADATA_MAP[verticalId] ?? VERTICAL_METADATA_MAP[DEFAULT_VERTICAL];
}

export function listVerticalIds(): string[] {
  return Object.keys(VERTICAL_METADATA_MAP);
}

/** Fetch simulation — what the frontend would call against GET /api/verticals/:id/metadata. */
export async function fetchVerticalMetadata(verticalId: string): Promise<VerticalMetadata> {
  return getVerticalMetadata(verticalId);
}

/** Lightweight provider that could be swapped for an HTTP client in the frontend. */
export class VerticalMetadataProvider {
  private cache = new Map<string, VerticalMetadata>();

  async get(verticalId: string): Promise<VerticalMetadata> {
    const cached = this.cache.get(verticalId);
    if (cached) return cached;
    const meta = await fetchVerticalMetadata(verticalId);
    this.cache.set(verticalId, meta);
    return meta;
  }

  clear(): void {
    this.cache.clear();
  }
}
