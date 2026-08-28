# FRONTEND — Content Automation Platform (BibleShorts)

## Stack

- Next.js 15.5.24 (App Router) · React 18 · TypeScript strict
- TailwindCSS 3.4 con Design Tokens CSS variables (`rgb(var(--token) / <alpha-value>)`)
- lucide-react para iconografía
- PWA (manifest + service worker + offline)
- i18n ES/EN propio (`src/theme/i18n.tsx`), persistido en localStorage

## Arquitectura

```
src/
├── app/                    # Rutas App Router (17 rutas)
│   ├── layout.tsx          # Providers: Language + Theme + PWA
│   ├── page.tsx            # Dashboard (envuelto en Shell)
│   ├── content/generate/   # Content Studio
│   ├── videos/             # Video Library
│   └── ...
├── components/
│   ├── ui/                 # Design System reutilizable
│   │   ├── button.tsx      # Button (6 variantes, 3 tamaños, focus-ring ARIA)
│   │   ├── card.tsx        # Card + CardHeader
│   │   ├── kpi-card.tsx    # KpiCard (tono semántico + progress bar)
│   │   ├── status-badge.tsx# StatusBadge (8 tonos de estado)
│   │   ├── pipeline-status.tsx # PipelineStatus visual del workflow
│   │   └── states.tsx      # EmptyState / LoadingState / ErrorState
│   ├── shell/shell.tsx     # Layout principal (sidebar oscura + header + bottom nav)
│   ├── dashboard/          # Dashboard centro de control
│   └── ...                 # Componentes existentes (review, costs, calendar...)
├── theme/
│   ├── branding.ts         # BrandConfig multi-vertical (violeta BibleShorts)
│   ├── i18n.tsx            # LanguageProvider + useLanguage
│   └── theme.tsx           # ThemeProvider light/dark/system persistido
├── mocks/
│   └── dashboard-mocks.ts  # Mocks aislados (NEXT_PUBLIC_USE_MOCKS=true)
└── locale/{es,en}/         # JSON de traducciones (referencia)
```

## Principios

1. **El backend es la autoridad.** Los permisos frontend son solo UI; el backend valida con AuthGuard + PermissionsGuard.
2. **Sin `fetch()` en componentes.** Los servicios se reutilizan; los datos mock viven SOLO en `src/mocks/`.
3. **Multi-vertical por diseño.** La navegación y categorías vienen de `useVerticalMetadata(verticalId)` → backend. Ningún componente hardcodea nav.
4. **Todo texto via `t(key)`.** Sin strings directos en componentes.
5. **Design Tokens únicos.** Light/dark comparten tokens; `.dark` solo cambia valores.

## Design Tokens

| Token | Uso |
|-------|-----|
| `primary` | Violeta BibleShorts (#7c3aed) — identidad |
| `secondary` | Superficies activas |
| `accent` | Detalle dorado |
| `success/warning/error/info` | Semántica de estado |
| `sidebar*` | Tokens exclusivos de la sidebar oscura |

Dark mode: clase `.dark` en `<html>`, controlada por ThemeProvider (light/dark/system, persistido).

## Mocks

Activación: `NEXT_PUBLIC_USE_MOCKS=true`. Con mocks desactivados el Dashboard muestra estado "Sin datos del backend" en lugar de datos falsos. Los mocks indican el endpoint TODO que los reemplazará.

## Comandos

```bash
cd apps/web
npm run dev        # desarrollo
npm run build      # producción (verificado ✓ 17 rutas)
npm run start      # servir build
```

## Accesibilidad

- `focus-ring` util class (ring visible en teclado)
- Touch targets ≥ 44px en bottom nav
- `aria-label`, `aria-current`, `aria-expanded`, `aria-modal`, roles y `role="progressbar"` en KPIs
- Contraste AA en ambos temas

## Limitaciones restantes

- E2E tests pendientes (Playwright configurado pero sin specs)
- Gráficos con CSS puro; migrar a librería de charts solo si se requiere interactividad avanzada
- Búsqueda del header sin backend aún (decorativa hasta conectar `/api/search`)
- Permisos de navegación: mientras no exista sesión, sidebar muestra todo (backend siempre valida)
