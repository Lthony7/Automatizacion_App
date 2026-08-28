# RESPONSIVE — Breakpoints

Diseño específico por breakpoint, no solo "encoger" el desktop.

## Breakpoints
| Rango | Dispositivo | Enfoque |
|-------|-----------|---------|
| 320–767 | Mobile | Bottom nav, review táctil, agenda cronológica |
| 768–1023 | Tablet | Sidebar colapsable, grids 2 col |
| 1024+ | Desktop | Sidebar fija, experiencia completa |

## Viewports de prueba
```
320×568 · 375×667 · 390×844 · 430×932
768×1024 · 1024×768 · 1366×768 · 1440×900 · 1920×1080
```

## Patrones por sección
- **Shell**: Desktop = sidebar fija; Mobile = bottom navigation (Inicio, Contenido,
  Revisión, Calendario, Más). "Más" despliega Producción/Biblioteca/Publicaciones/
  Analytics/Costos/Configuración.
- **Dashboard**: Mobile prioriza Videos de hoy, Pendientes, Aprobados, Programados,
  Errores (oculta secundarios).
- **Review**: Desktop = 2 columnas (video 9:16 + panel). Mobile = flujo vertical
  (video → resumen → IA → validación → Approve/Reject) con botones ≥44×44px.
- **Calendar**: Desktop = calendario visual (mes/semana/día). Mobile = agenda lista.
- **Video preview**: siempre `object-fit: contain` (9:16, sin deformar). Touch optimizado.

## Touch targets
Botones de acción crítica (Approve/Reject) con `min-height: 44px`.

## Performance
Imágenes optimizadas, lazy loading, code splitting por ruta (Next.js App Router),
sin FFmpeg ni módulos pesados en cliente.
