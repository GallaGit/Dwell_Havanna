# 04 — Backend y datos: Supabase + fallback

Fuente: `site/lib/db.ts`, `site/lib/content.ts`, `site/lib/data.ts`, `site/lib/site.ts`, `site/supabase/01-schema.sql`, `site/supabase/02-seed.sql`.

El modelo editorial y el orden de evolución de permisos están en `docs/PRODUCT/roadmap.md`.

## Principio

Toda lectura pública pasa por `site/lib/content.ts`. Si hay Supabase configurado lee `status='published'`; si no, o si la query falla, **cae a `site/lib/data.ts`** sin romper el build. Las páginas no cambian de props.

## Capas `lib/`

| Archivo | Export | Notas |
|---|---|---|
| `site/lib/db.ts` | `getServiceClient()` | `createClient(url, service_role, {persistSession:false})`, cacheado. `null` si faltan `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. **Nunca importar desde cliente.** |
| `site/lib/content.ts` | `listPublishedProperties()`, `getPropertyBySlug()`, `listPublishedPosts()`, `getPostBySlug()` | `eq("status","published")`, `order("published_at", desc)`. Mapea `date_label→date`, `reading_time→readingTime`. `try/catch → fallback`. |
| `site/lib/data.ts` | `Property`, `JournalPost`, `properties[3]`, `journalPosts[4]`, `getProperty`, `getPost` | Helper `img(id)` a `images.unsplash.com`. Campos property: slug/name/location/character/description/cover/images/facts/architecture/interior/story. |
| `site/lib/site.ts` | `siteUrl`, `canonicalFor(path)` | `NEXT_PUBLIC_SITE_URL ?? "https://dwellhavana.com"`, trim `/` final. Usado en OG, sitemap, feed, embed. |

## Schema (`site/supabase/01-schema.sql`)

Aplicar en SQL Editor: `01` luego `02`.

| Tabla | Clave | Campos relevantes |
|---|---|---|
| `properties` | `slug PK` | name, location, character, description, cover, `images text[]`, `facts jsonb`, architecture, interior, story, `status draft/review/published`, `published_at` |
| `journal_posts` | `slug PK` | title, category, excerpt, image, `date_label`, `reading_time`, `body_mdx` (Fase 2), status, timestamps |
| `verified_contributors` | `handle PK` (`@...`) | `auth_user_id` único, display_name, `source ig/fb/direct` |
| `submissions` | `id uuid` | `author_handle FK`, `image_url`, `caption_raw`, `source form/ig/fb`, `external_id unique`, `rights_granted bool`, `status pending/approved/rejected` |
| `syndications` | `id uuid` | `post_type property/journal`, `post_slug`, `target fb/ig/partner:*`, `external_id/url`, `status queued/published/failed`, índice `(post_type, post_slug)` |

Las migraciones `supabase/migrations/20260921000100_contributor_auth.sql` y
`supabase/migrations/20260921000200_editorial_permissions.sql` añaden el vínculo
con Supabase Auth, `editorial_members` y `moderation_events`. El servidor consulta
el miembro activo con `auth_user_id`, `role` y `active`; no usa `user_metadata`.

Testing tiene ambas migraciones aplicadas. `editorial_members` todavía no tiene
filas porque falta registrar una cuenta editorial separada del usuario E2E.

Seguridad: `RLS enabled` en las 5 tablas **sin policies** → `anon/authenticated` no leen nada; las operaciones privilegiadas van por `service_role`. La API valida además la sesión Supabase Auth y el vínculo `auth_user_id`. Storage: bucket `dwell-media` público-lectura (`policy select where bucket_id='dwell-media'`), escritura solo `service_role`.

## Seed (`site/supabase/02-seed.sql`)

Migra los 3 properties + 4 posts de `data.ts` con `status='published'`, `on conflict (slug) do update` (idempotente).

## Medios

- Original en `submissions/<handle>/<uuid>.jpg`; variantes WebP/AVIF responsive las genera `next/image` al servir.
- `site/next.config.ts` ya permite `*.supabase.co`.
