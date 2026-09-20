# 03 — Frontend: rutas y render

Fuente: `site/app/**/page.tsx`, `site/app/**/route.ts`, `site/components/*.tsx`.

Los flujos editoriales y las decisiones de permisos están en `docs/PRODUCT/05-flujos-editoriales.md` y `docs/PRODUCT/roadmap.md`.

## Tabla de rutas (19 en build Fase 1)

| Ruta | Archivo | Tipo / render |
|---|---|---|
| `/` | `site/app/page.tsx` | Server Component, `revalidate 3600` |
| `/about` (+ `#contact`) | `site/app/about/page.tsx` | Estática, contacto `hola@dwellhavana.example` |
| `/properties` | `site/app/properties/page.tsx` | Server, lista desde `listPublishedProperties()` |
| `/properties/[slug]` ×3 | `site/app/properties/[slug]/page.tsx` | SSG+ISR, `generateStaticParams()` + `generateMetadata()` OG |
| `/journal` | `site/app/journal/page.tsx` | Server, lista desde `listPublishedPosts()` |
| `/journal/[slug]` ×4 | `site/app/journal/[slug]/page.tsx` | SSG+ISR + OG propio |
| `/contribuir` | `site/app/contribuir/page.tsx` | **Único `"use client"`**: formulario + `fetch POST /api/submissions` |
| `/admin/review` | `site/app/admin/review/page.tsx` | Server + Server Actions (`login`, `decide`) |
| `/api/submissions` | `site/app/api/submissions/route.ts` | `POST` dinámico, `runtime nodejs` |
| `/feed.xml` | `site/app/feed.xml/route.ts` | `GET` RSS, `revalidate 3600` |
| `/sitemap.xml` | `site/app/sitemap.ts` | Sitemap dinámico |
| `/embed/[slug]` | `site/app/embed/[slug]/route.ts` | `GET` HTML standalone para `<iframe>` |

Slugs iniciales: `casa-miramar-1938`, `apartamento-vedado-luz`, `casa-colon-patio` / `light-in-vedado`, `terrazzo-memory`, `patio-houses`, `people-who-restore`.

## Home (`site/app/page.tsx`)

Orden revista (igual que `Design-Direction.md` §Homepage): featured → journal (`01`) → featured homes (`02`) → patio/architecture (`03`) → Havana (`04`) → about (`05`). Max `1400px`, grid 12 col, `Image priority` solo en hero.

## Detalles

- Property (`site/app/properties/[slug]/page.tsx`): hero → título/location/intro → galería `images.slice(1)` → architecture/interior/story → facts `<dl>` → CTA `/about#contact` → prev/next.
- Journal (`site/app/journal/[slug]/page.tsx`): kicker categoría/fecha/lectura → título → excerpt → hero 16/9 → 3 párrafos editoriales fijos.
- Índices: filtros visuales no funcionales (`All/Miramar/Vedado/Centro`, `All/Architecture/...`), curaduría sobre base de datos.

## Componentes (`site/components/`)

- `Editorial.tsx`: `SectionHeading({index,label,title,href})`, `PropertyEntry({property})` (cover 4/3 + location/name + character/description), `JournalEntry({post})` (imagen 3/2 + categoría/fecha + título + excerpt + readingTime).
- `SiteHeader.tsx`: sticky, `bg-paper/95 backdrop-blur`, nav Journal/Properties/About + `Enquire → /about#contact`.
- `SiteFooter.tsx` (`id="contact"`): manifiesto, índice, categorías journal, contacto, `© 2026 Editorial prototype / Not a catalogue. A magazine.`
