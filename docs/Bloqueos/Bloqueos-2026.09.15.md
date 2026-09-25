# Bloqueo E2E — 2026.09.15

Estado: **resuelto**. El cierre está en `docs/Idea/Fase-1-Cierre.md` §8.

## Qué bloqueaba

`POST /api/submissions` respondió `403 unknown_contributor` para `@gallados_lab`, aunque el handle existía. El dev server era anterior al `.env` final y servía una ruta rancia.

## Resolución

Con un servidor de desarrollo fresco, el envío respondió `200`. La prueba del 2026-09-15 en el proyecto `sfujmwumtzuzwwhfmyxa` cubrió lectura con `service_role`, RLS con la key pública, el envío, la moderación, feed, sitemap y la limpieza. Ver §8 de `docs/Idea/Fase-1-Cierre.md`.

La nota duplicada `Bloqueos-2020.09.15.md` se eliminó. Era el mismo texto con el año mal escrito.

El 2026-09-25 el proyecto `sfujmwumtzuzwwhfmyxa` está activo y con el esquema editorial aplicado. El estado está en `docs/Tech/08-estado-supabase-2026-09-25.md`. Lo que queda del Paso 2 en `docs/PRODUCT/roadmap.md` es el lanzamiento, no este bloqueo.
