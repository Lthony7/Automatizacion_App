# PWA — BibleShorts

El frontend Next.js está configurado como **Progressive Web App**.

## Archivos
- `public/manifest.json` — nombre, shortcuts, icons (192/512 PNG generados desde `Logo_Bible.png`).
- `public/sw.js` — Service Worker (offline shell + push).
- `public/offline.html` — pantalla offline.
- `public/brand/pwa-icon-192.png`, `pwa-icon-512.png`, `logo-icon.png`.

## Registro
`src/components/shell/pwa-register.tsx` exporta `PWARegister` (Client Component) que se monta
en `src/app/layout.tsx`. Registra `/sw.js` al cargar.

## Installability
- Manifest válido con `display: standalone`, `theme_color`, `background_color`.
- Icons maskable 192/512.
- HTTPS (en producción) o `localhost` en dev.

## Estrategia de caché (sw.js)
- **Nunca** cachea: `/api/*`, `/auth/*`, ni peticiones no-GET.
- Navegación: network-first con fallback a caché y luego a `offline.html`.
- Assets estáticos (css/js/img/font): cache-first.
- **No** se almacena: API Keys, tokens sociales, ni datos privados de otros tenants.

## Push
`sw.js` implementa `push` y `notificationclick`. Preparado para Web Push y futuro móvil.
Tipos de notificación alineados con `notifications.title` en i18n:
video_generated, review_pending, video_approved, video_rejected,
publication_succeeded, publication_failed, budget_reached, system_error.

## Notas
El SW usa `skipWaiting` + `clients.claim` para activarse rápido. Si cambias el shell,
incrementa `CACHE_NAME` para invalidar la caché vieja.
