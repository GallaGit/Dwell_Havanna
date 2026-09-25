# 01 — Stack tecnológico (`package.json`)

Fuente: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `app/globals.css`, `app/layout.tsx`.

Las decisiones de producto y el roadmap están en `docs/PRODUCT/roadmap.md`.

## Core

| Pieza | Versión / detalle | Dónde se ve |
|---|---|---|
| Next.js (App Router) | `16.3.5` | `package.json`, `app/layout.tsx`, `next.config.ts` |
| React + React DOM | `19.2.8` | `package.json` |
| TypeScript | `^5`, `strict: true`, `jsx: react-jsx`, alias `@/* → ./*` | `tsconfig.json` |
| Tailwind CSS | `^4` vía `@tailwindcss/postcss` + `@import "tailwindcss"` | `postcss.config.mjs`, `app/globals.css` |
| Supabase JS | `@supabase/supabase-js ^2.116.0` (solo server, ver `04`) | `lib/db.ts`, `package.json` |
| Node runtime | Route Handlers y admin con `export const runtime = "nodejs"` | `app/api/submissions/route.ts`, `app/admin/review/page.tsx` |
| ESLint | `^9` + `eslint-config-next` (core-web-vitals + typescript) | `eslint.config.mjs`, script `npm run lint` |

## Rendering / imágenes / fuentes

- `next/image` con `remotePatterns` en `next.config.ts`: `images.unsplash.com`, `picsum.photos`, `*.supabase.co` (bucket `dwell-media`, Fase 1).
- `next/font/google` en `app/layout.tsx`: Fraunces (normal e itálica, variable `--font-fraunces`) e Inter (`--font-inter`), `display: swap`. `@theme` apunta `--font-display` y `--font-body` a esas variables, con Georgia y `system-ui` como reserva.
- `next/image`: `qualities: [70]` en `next.config.ts`, porque Next 16 solo admite 75 si no se declara la lista. La imagen LCP usa `preload`.
- ISR con `export const revalidate = 3600` en home, slugs, sitemap, feed y embed. El embed también exporta `generateStaticParams()`.
- `generateStaticParams()` en properties, journal y embed lee slugs publicados desde la capa de contenido.
- Metadata global en `app/layout.tsx`: `metadataBase`, plantilla de título `%s — Dwell Havana`, Open Graph y Twitter por defecto. Cada página pública repite su canonical y su imagen con `lib/page-metadata.ts`, porque un `openGraph` hijo sustituye el objeto entero.

## Estilo editorial (tokens)

Definidos en `app/globals.css` bajo `@theme`:

| Token | Valor |
|---|---|
| `--color-paper` | `#faf7f2` |
| `--color-cream` | `#f3eee6` |
| `--color-ink` | `#161412` |
| `--color-charcoal` | `#2e2b27` |
| `--color-muted` | `#6f685e` |
| `--color-line` | `#e3dccf` |
| `--color-clay` | `#87573a` |
| `--font-display` | `var(--font-fraunces), Georgia, serif` |
| `--font-body` | `var(--font-inter), system-ui, sans-serif` |

Helpers propios: `.editorial-grid` (12 col), `.meta-label`, `.rule`, `.img-editorial` (+ hover scale), `.reveal`, `.prose-editorial`.

## Lo que NO hay (decisión implícita)

- Sin ORM, sin NextAuth, sin CMS headless, sin librería de formularios, sin i18n.
- Pruebas con `node:test`: `npm test`. El E2E HTTP queda omitido si no hay variables `E2E_*`.
- Acceso editorial con Supabase Auth y roles `owner` o `moderator`. `ADMIN_TOKEN` y la cookie `dh_admin` quedan como fallback temporal (ver `docs/PRODUCT/05-flujos-editoriales.md`).
- `README.md` describe el proyecto y apunta a `docs/`. El detalle de stack vive en esta carpeta.
- `AGENTS.md` / `CLAUDE.md` solo contienen la regla de agente de Next (leer `node_modules/next/dist/docs/` antes de codificar).
