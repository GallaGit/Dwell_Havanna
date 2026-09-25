# 04 — Backend y datos: Supabase + fallback

Fuente: `lib/db.ts`, `lib/content.ts`, `lib/data.ts`, `lib/site.ts`, `supabase/01-schema.sql`, `supabase/02-seed.sql`.

El modelo editorial y el orden de evolución de permisos están en `docs/PRODUCT/roadmap.md`.

## Principio

Toda lectura pública pasa por `lib/content.ts`. Si hay Supabase configurado lee `status='published'`; si no, o si la query falla, **cae a `lib/data.ts`** sin romper el build. Las páginas no cambian de props.

## Capas `lib/`

| Archivo | Export | Notas |
|---|---|---|
| `lib/db.ts` | `getPublishedContentClient()`, `getServiceClient()` | El primero usa `fetch` con `revalidate: 3600` y el tag `published-content`. El segundo sigue en `cache: "no-store"` para la cola y las mutaciones. Ambos devuelven `null` si faltan la URL o la service role. **Nunca importar desde cliente.** |
| `lib/content.ts` | `listPublishedProperties()`, `getPropertyBySlug()`, `listPublishedPosts()`, `getPostBySlug()` | Envueltos en `cache()`. El slug consulta `.eq("slug")`. Si la query falla, cae a `lib/data.ts`. Si la query responde y no hay fila, devuelve `undefined`. El cuerpo del post es el placeholder de `lib/placeholders.ts`. |
| `lib/data.ts` | `Property`, `JournalPost`, `properties[3]`, `journalPosts[4]` | Las URLs de foto salen de `lib/placeholders.ts`. |
| `lib/site.ts` | `siteUrl`, `canonicalFor(path)` | `NEXT_PUBLIC_SITE_URL ?? "https://dwellhavana.com"`, trim `/` final. Usado en OG, sitemap, feed, embed. |

## Schema

El orden de aplicación está en `docs/Tech/06-config-operacion.md`. En una base nueva empieza por `supabase/01-schema.sql`. Si `verified_contributors` ya existe sin `auth_user_id`, `supabase/03-contributor-auth.sql` va antes. Producción se migró así el 2026-09-25. El estado de las dos bases está en `docs/Tech/08-estado-supabase-2026-09-25.md`.

| Tabla | Clave | Campos relevantes |
|---|---|---|
| `properties` | `slug PK` | name, location, character, description, cover, `images text[]`, `facts jsonb`, architecture, interior, story, `status draft/review/published`, `published_at` |
| `journal_posts` | `slug PK` | title, category, excerpt, image, `date_label`, `reading_time`, `body_mdx` (Fase 2), status, timestamps |
| `verified_contributors` | `handle PK` (`@...`) | `auth_user_id` único, display_name, `source ig/fb/direct` |
| `submissions` | `id uuid` | `author_handle FK`, `image_url`, `caption_raw`, `source form/ig/fb`, `external_id unique`, `rights_granted bool`, `status pending/approved/rejected` |
| `syndications` | `id uuid` | `post_type property/journal`, `post_slug`, `target fb/ig/partner:*`, `external_id/url`, `status queued/published/failed`, índice `(post_type, post_slug)` |
| `editorial_members` | `auth_user_id PK`, FK a `auth.users` | `role owner/moderator`, `active`, `display_name`, timestamps |
| `moderation_events` | `id uuid` | `actor_user_id`, `actor_source auth/legacy_admin`, `action` (6 valores), `submission_id`, `target_handle`, `metadata jsonb` |

`supabase/03-contributor-auth.sql` duplica `supabase/migrations/20260921000100_contributor_auth.sql`. `supabase/04-editorial-permissions.sql` duplica `supabase/migrations/20260921000200_editorial_permissions.sql`. `20260921000300` amplía el check de acciones a 6 valores. `supabase/migrations/` no contiene el esquema base. El servidor consulta el miembro activo con `auth_user_id`, `role` y `active`. No usa `user_metadata`.

Testing (`ypeizxnafipvojpntsaw`) tiene el SQL canónico, las tres migraciones, `canonical_01_schema` (`20260925174404`), el seed, 3 usuarios Auth y dos `owner` activos. Producción (`sfujmwumtzuzwwhfmyxa`) tiene las mismas siete tablas desde el 2026-09-25, el seed, cero usuarios Auth y cero filas en `editorial_members`. En producción `auth_user_id` es la última columna; en testing es la segunda. Producción conserva `public.rls_auto_enable()` con `EXECUTE` revocado a `anon`, `authenticated` y `public`. Testing no tiene esa función.

Seguridad: `RLS enabled` en las 7 tablas, **sin policies** de lectura pública. `anon` y `authenticated` no leen esas filas. Las operaciones privilegiadas van por `service_role`. La API valida además la sesión Supabase Auth y el vínculo `auth_user_id`. Storage: bucket `dwell-media` público-lectura (policy `dwell-media public read`), escritura solo `service_role`. El índice `verified_contributors_auth_user_idx` es redundante con el índice del `UNIQUE`. Los advisors INFO que quedan están en el documento de estado.

## Seed (`supabase/02-seed.sql`)

Migra los 3 properties + 4 posts de `data.ts` con `status='published'`, `on conflict (slug) do update` (idempotente).

## Medios

- Original en `submissions/<handle>/<uuid>.jpg`; variantes WebP/AVIF responsive las genera `next/image` al servir.
- `next.config.ts` ya permite `*.supabase.co`.
