# 01 — Stack tecnológico (`site/package.json`)

Fuente: `site/package.json`, `site/next.config.ts`, `site/tsconfig.json`, `site/postcss.config.mjs`, `site/eslint.config.mjs`, `site/app/globals.css`, `site/app/layout.tsx`.

Las decisiones de producto y el roadmap están en `docs/PRODUCT/roadmap.md`.

## Core

| Pieza | Versión / detalle | Dónde se ve |
|---|---|---|
| Next.js (App Router) | `16.3.5` | `site/package.json`, `site/app/layout.tsx`, `site/next.config.ts` |
| React + React DOM | `19.2.8` | `site/package.json` |
| TypeScript | `^5`, `strict: true`, `jsx: react-jsx`, alias `@/* → ./*` | `site/tsconfig.json` |
| Tailwind CSS | `^4` vía `@tailwindcss/postcss` + `@import "tailwindcss"` | `site/postcss.config.mjs`, `site/app/globals.css` |
| Supabase JS | `@supabase/supabase-js ^2.116.0` (solo server, ver `04`) | `site/lib/db.ts`, `site/package.json` |
| Node runtime | Route Handlers y admin con `export const runtime = "nodejs"` | `site/app/api/submissions/route.ts`, `site/app/admin/review/page.tsx` |
| ESLint | `^9` + `eslint-config-next` (core-web-vitals + typescript) | `site/eslint.config.mjs`, script `npm run lint` |

## Rendering / imágenes / fuentes

- `next/image` con `remotePatterns` en `site/next.config.ts`: `images.unsplash.com`, `picsum.photos`, `*.supabase.co` (bucket `dwell-media`, Fase 1).
- `next/font/google` en `site/app/layout.tsx`: `Fraunces` (`--font-display`) + `Inter` (`--font-body`), `display: swap`.
- ISR con `export const revalidate = 3600` en home, slugs, sitemap, feed y embed.
- `generateStaticParams()` en `site/app/properties/[slug]/page.tsx` y `site/app/journal/[slug]/page.tsx` lee slugs publicados desde la capa de contenido.
- `generateMetadata()` por slug: `title`, `description`, `alternates.canonical`, OpenGraph `article` + Twitter `summary_large_image`.

## Estilo editorial (tokens)

Definidos en `site/app/globals.css` bajo `@theme`:

| Token | Valor |
|---|---|
| `--color-paper` | `#faf7f2` |
| `--color-cream` | `#f3eee6` |
| `--color-ink` | `#161412` |
| `--color-charcoal` | `#2e2b27` |
| `--color-muted` | `#837b6f` |
| `--color-line` | `#e3dccf` |
| `--color-clay` | `#87573a` |
| `--font-display` | `Fraunces, Georgia, serif` |
| `--font-body` | `Inter, system-ui, sans-serif` |

Helpers propios: `.editorial-grid` (12 col), `.meta-label`, `.rule`, `.img-editorial` (+ hover scale), `.reveal`, `.prose-editorial`.

## Lo que NO hay (decisión implícita)

- Sin ORM, sin NextAuth, sin CMS headless, sin librería de formularios, sin tests, sin i18n.
- Admin mínimo propio con `ADMIN_TOKEN` + cookie `dh_admin` (ver `05`).
- `site/README.md` es el default de `create-next-app`, no describe este proyecto — este `Tech/` lo sustituye en la práctica.
- `site/AGENTS.md` / `site/CLAUDE.md` solo contienen la regla de agente de Next (leer `node_modules/next/dist/docs/` antes de codificar).
