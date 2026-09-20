# Docs Tech — Dwell Havana (`site/`)

> Documentación técnica generada 2026-09-15 leyendo `site/` directamente.
> No modifica lo existente: `Dwell-Havana_Design-Direction/` y `Idea/` quedan intactos.

## Qué hay en `docs/`

| Carpeta | Contenido | Estado |
|---|---|---|
| `Dwell-Havana_Design-Direction/Design-Direction.md` | Dirección editorial/visual (revista, no portal) | Existente, no tocado |
| `Idea/Fase-1-Cierre.md` | Cierre Fase 1 verificada (lint+build, 19 rutas) | Existente, no tocado |
| `Idea/Plan-Crossposting.md` | Plan híbrido ingesta/sindicación Fases 1-3 | Existente, no tocado |
| `Idea/Talking-to-client.md` | Nota idea crossposting | Existente, no tocado |
| `Tech/` (esta carpeta) | Stack + estructura real de `site/` | **Nuevo** |

## Índice `Tech/`

1. `01-stack.md` — stack tecnológico (Next, React, Tailwind, Supabase, fuentes, tooling).
2. `02-estructura-carpetas.md` — árbol de `site/` y rol de cada archivo/carpeta.
3. `03-frontend-rutas-render.md` — rutas App Router, render ISR/SSG, metadata OG, componentes.
4. `04-backend-datos-supabase.md` — `lib/db.ts`, `lib/content.ts`, `lib/data.ts`, schema SQL, Storage.
5. `05-flujos-editoriales.md` — ingesta `/contribuir` → `/api/submissions` → `/admin/review` → sindicación pull (`sitemap`, `feed.xml`, `embed`).
6. `06-config-operacion.md` — env vars, scripts, activación Supabase, seguridad.

## Documentación de producto

Los documentos de roadmap, flujos editoriales y uso del sistema viven en [`../PRODUCT/`](../PRODUCT/README.md):

- `../PRODUCT/roadmap.md` — fases, decisiones y trabajo pendiente.
- `../PRODUCT/05-flujos-editoriales.md` — flujo editorial y moderación.
- `../PRODUCT/07-guia-acceso-colaboradores.md` — guía para editoras y colaboradores.

## Lectura rápida (30 segundos)

- App: **Next.js 16.3.5 App Router + React 19.2.8 + TS 5 + Tailwind v4**, en `site/`.
- Datos: **Supabase Postgres + Storage (`dwell-media`)** con **fallback estático** en `site/lib/data.ts` si no hay DB.
- Contenido: `properties` (3) + `journal_posts` (4), solo `status='published'` llega a la web, ISR `revalidate 3600`.
- Flujo humano obligatorio: nada se publica sin pasar por `/admin/review`.
- Permisos editoriales futuros: cuentas individuales de Supabase con roles `owner` y `moderator`; el roadmap define la migración desde `ADMIN_TOKEN`.
- Fuente de verdad editorial: `docs/Dwell-Havana_Design-Direction/Design-Direction.md`. Fuente de verdad de fases: `docs/Idea/Fase-1-Cierre.md`.

## Convención

- Rutas de código siempre relativas a la raíz del proyecto: `site/app/...`, `site/lib/...`, `site/supabase/...`.
- Si un doc de `Idea/` y uno de `Tech/` discrepan, manda el código de `site/` (este `Tech/` se escribió leyendo el código).
