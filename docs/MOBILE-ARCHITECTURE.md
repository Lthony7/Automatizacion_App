# MOBILE ARCHITECTURE (Futuro: Expo + React Native)

Este documento define la arquitectura preparatoria para una futura app móvil **Expo + React Native**
que consumirá **exactamente el mismo backend** que el frontend web. No se crea código móvil en FASE 9.5.

## Regla fundamental
```
Web ─┐
     ├─► API ─► Backend (NestJS)
Móvil┘
```
La app móvil usará: mismo API, mismos DTOs, mismos permisos (RBAC), mismo workflow,
mismo Domain Engine, mismo AI Engine, mismo Publication Engine, mismo Analytics.
**NO** se crea: mobile backend, mobile database, mobile authentication.

## Capas a reutilizar
| Capa | Origen | Notas |
|------|--------|------|
| API Client | `apps/web/src/services/*` (futuro) | Misma base URL, mismos interceptores |
| DTOs / Types | `packages/shared` | Compartir sin duplicar |
| Auth | JWT existente | Login web = login móvil |
| Permisos | `apps/web/src/utils/permissions.ts` | Roles OWNER/ADMIN/EDITOR/REVIEWER/VIEWER |
| Video streaming | Presigned URLs (S3/GCS) | Mismo flujo que web |

## Áreas a definir en la app móvil
1. **Authentication** — JWT via mismo endpoint `/auth/login`. Almacenar token en
   `expo-secure-store` (no AsyncStorage para producción).
2. **Navigation** — React Navigation (Stack + Tabs). Los tabs móviles priorizados:
   Inicio, Revisión, Calendario, Notificaciones, Más.
3. **API Client** — Axios/Fetch wrapper idéntico al web, con refresh token.
4. **Push Notifications** — Expo Push + suscripción al mismo servicio que el PWA
   (`/api/notifications/subscribe`).
5. **Video Streaming** — `<Video>` (expo-av) apuntando a URL firmada; nunca enviar
   el archivo por el backend.
6. **File Upload** — Presigned URL → Object Storage → BullMQ (igual que web).
7. **Review Workflow** — Reutilizar `ReviewStudio` adaptado: video 9:16, botones
   Approve/Reject ≥44×44px, bottom sheets.
8. **Offline Strategy** — SQLite (expo-sqlite) para caché de lectura; cola de acciones
   pendientes (aprobar/rechazar) que se sincronizan al recuperar conexión.

## UI vs Lógica
La interfaz puede diferir entre web y móvil. La **lógica de negocio NO**.
El backend sigue siendo la autoridad; el frontend/móvil solo oculta acciones por permiso
pero nunca confía en sí mismo para autorizar.
