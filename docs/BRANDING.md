# BRANDING — BibleShorts

Sistema de marca centralizado. **No hardcodees** el logo ni colores en múltiples componentes.

## Configuración (`src/theme/branding.ts`)
```ts
interface BrandConfig {
  name, tagline,
  logo: { main, icon, favicon, pwa },
  colors: { primary, secondary, accent, background, surface, ... },
  fonts: { sans, display },
  theme
}
```
`brandConfigs` contiene una config por vertical: `christian`, `automotive`, `fitness`,
`education`, `cooking`. `getBrandConfig(vertical)` devuelve la activa.

## Logo oficial
- `public/brand/Logo_Bible.png` — logo principal (colocado por el usuario).
- `public/brand/logo-icon.png` — icono 64px (generado desde el PNG con sharp).
- `public/brand/pwa-icon-192.png`, `pwa-icon-512.png` — icons PWA.
- Se usan en: Header, Sidebar, Login, Favicon, PWA icon, Mobile, Loading screen.

## Aplicación dinámica
`applyBrandToCSS(brand)` inyecta variables CSS en `:root`
(`--color-primary`, `--color-secondary`, etc.) y fuentes (`--font-sans`, `--font-display`).
El `VerticalSelector` llama a esta función al cambiar de vertical, actualizando
colores/tipografía sin tocar componentes.

## Tokens de diseño (Tailwind)
Los colores semánticos (`primary`, `secondary`, `accent`, `background`, `surface`,
`surfaceSecondary`, `textPrimary`, `textSecondary`, `border`, `success`, `warning`,
`error`, `info`) se mapean a variables CSS para poder cambiarlos globalmente.

## Regla
Para cambiar la marca, edita `branding.ts` y los assets en `public/brand/`.
No edites colores directamente en clases Tailwind de los componentes.
