export interface BrandConfig {
  name: string
  tagline: string
  logo: {
    main: string
    icon: string
    favicon: string
    pwa: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    surfaceSecondary: string
    card: string
    muted: string
    textPrimary: string
    textSecondary: string
    border: string
    success: string
    warning: string
    error: string
    info: string
    sidebar: string
    sidebarHover: string
    sidebarText: string
    sidebarBorder: string
  }
  fonts: {
    sans: string
    display: string
  }
  theme: 'light' | 'dark' | 'system'
}

const bibleColors = {
  primary: '#7c5317',
  secondary: '#a56f20',
  accent: '#a66511',
  background: '#fbf7ed',
  surface: '#fffaf0',
  surfaceSecondary: '#f9efd8',
  card: '#fffdf8',
  muted: '#f1e3c1',
  textPrimary: '#34230e',
  textSecondary: '#705d3e',
  border: '#e7d2a1',
  success: '#087a55',
  warning: '#8f5500',
  error: '#b42318',
  info: '#2366a4',
  sidebar: '#f7e9c8',
  sidebarHover: '#efd6a0',
  sidebarText: '#4a3212',
  sidebarBorder: '#e2c074',
}

export const defaultBrand: BrandConfig = {
  name: 'BibleShorts',
  tagline: 'Contenido que inspira',
  logo: {
    main: '/brand/Logo_Bible.png',
    icon: '/brand/logo-icon.png',
    favicon: '/brand/logo-icon.png',
    pwa: '/brand/pwa-icon-512.png',
  },
  colors: { ...bibleColors },
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    display: 'Merriweather, serif',
  },
  theme: 'system',
}

export const brandConfigs: Record<string, BrandConfig> = {
  'bible-shorts': defaultBrand,
  christian: {
    ...defaultBrand,
    name: 'BibleShorts',
    tagline: 'Contenido que inspira',
    colors: { ...bibleColors },
  },
  automotive: {
    ...defaultBrand,
    name: 'AutoShorts',
    tagline: 'Contenido automotriz',
    colors: {
      ...bibleColors,
      primary: '#6f4a16',
      secondary: '#98702e',
      accent: '#9b6817',
    },
  },
  fitness: {
    ...defaultBrand,
    name: 'FitShorts',
    tagline: 'Tu guía de fitness',
    colors: {
      ...bibleColors,
      primary: '#794a22',
      secondary: '#a66c36',
      accent: '#a85b2c',
    },
  },
  education: {
    ...defaultBrand,
    name: 'EduShorts',
    tagline: 'Aprende rápido',
    colors: {
      ...bibleColors,
      primary: '#65501e',
      secondary: '#8d7434',
      accent: '#816326',
    },
  },
  cooking: {
    ...defaultBrand,
    name: 'CookShorts',
    tagline: 'Recetas en corto',
    colors: {
      ...bibleColors,
      primary: '#794a22',
      secondary: '#a66c36',
      accent: '#a85b2c',
    },
  },
}

export function getBrandConfig(vertical: string): BrandConfig {
  return brandConfigs[vertical] || defaultBrand
}

function hexToRgbChannels(hex: string): string {
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

export function applyBrandToCSS(brand: BrandConfig) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', hexToRgbChannels(brand.colors.primary))
  root.style.setProperty('--color-secondary', hexToRgbChannels(brand.colors.secondary))
  root.style.setProperty('--color-accent', hexToRgbChannels(brand.colors.accent))
  root.style.setProperty('--color-background', hexToRgbChannels(brand.colors.background))
  root.style.setProperty('--color-surface', hexToRgbChannels(brand.colors.surface))
  root.style.setProperty('--color-surface-secondary', hexToRgbChannels(brand.colors.surfaceSecondary))
  root.style.setProperty('--color-card', hexToRgbChannels(brand.colors.card))
  root.style.setProperty('--color-muted', hexToRgbChannels(brand.colors.muted))
  root.style.setProperty('--color-text-primary', hexToRgbChannels(brand.colors.textPrimary))
  root.style.setProperty('--color-text-secondary', hexToRgbChannels(brand.colors.textSecondary))
  root.style.setProperty('--color-border', hexToRgbChannels(brand.colors.border))
  root.style.setProperty('--color-success', hexToRgbChannels(brand.colors.success))
  root.style.setProperty('--color-warning', hexToRgbChannels(brand.colors.warning))
  root.style.setProperty('--color-error', hexToRgbChannels(brand.colors.error))
  root.style.setProperty('--color-info', hexToRgbChannels(brand.colors.info))
  if (brand.colors.sidebar) root.style.setProperty('--color-sidebar', hexToRgbChannels(brand.colors.sidebar))
  if (brand.colors.sidebarHover) root.style.setProperty('--color-sidebar-hover', hexToRgbChannels(brand.colors.sidebarHover))
  if (brand.colors.sidebarText) root.style.setProperty('--color-sidebar-text', hexToRgbChannels(brand.colors.sidebarText))
  if (brand.colors.sidebarBorder) root.style.setProperty('--color-sidebar-border', hexToRgbChannels(brand.colors.sidebarBorder))
  root.style.setProperty('--font-sans', brand.fonts.sans)
  root.style.setProperty('--font-display', brand.fonts.display)
}
