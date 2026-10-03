# 04 — Backend y datos: Supabase + fallback

Fuente: `lib/db.ts`, `lib/content.ts`, `lib/data.ts`, `lib/site.ts`, `supabase/01-schema.sql`, `supabase/02-seed.sql`.

El modelo editorial y el orden de evolución de permisos están en `docs/PRODUCT/roadmap.md`.

## Principio

Toda lectura pública pasa por `lib/content.ts`. Si hay Supabase configurado lee `status='published'`; si no, o si la query falla, **cae a `lib/data.ts`** sin romper el build. Las páginas no cambian de props.

## Capas `lib/`

| Archivo | Export | Notas |
|---|---|---|
| `lib/db.ts` | `getPublishedContentClient()`, `getServiceClient()` | El primero usa la clave publishable, `fetch` con `revalidate: 3600` y el tag `published-content`. El segundo usa `service_role` y `cache: "no-store"` para la cola y las mutaciones. `lib/content.ts` repite la lectura publicada con el segundo solo si la publishable no devuelve filas. Importa `server-only`. |
| `lib/content.ts` | `listPublishedProperties()`, `getPropertyBySlug()`, `listPublishedPosts()`, `getPostBySlug()` | Envueltos en `cache()`. El slug consulta `.eq("slug")`. Si la query falla, cae a `lib/data.ts`. Si la query responde y no hay fila, devuelve `undefined`. El cuerpo del post es el placeholder de `lib/placeholders.ts`. |
| `lib/data.ts` | `Property`, `JournalPost`, `properties[3]`, `journalPosts[4]` | Las URLs de foto salen de `lib/placeholders.ts`. |
| `lib/site.ts` | `siteUrl`, `canonicalFor(path)`, `resolveSiteUrl()`, `resolveInviteOrigin()` | `NEXT_PUBLIC_SITE_URL` si es una URL `http(s)` absoluta. Si falta, está vacía, es solo espacios o no es válida, `https://dwell-havanna.vercel.app`. Se quitan las barras finales. Un valor inválido avisa en el build. Usado en OG, sitemap, feed, embed. Las invitaciones usan `http://localhost:3000` si la variable falta o está vacía. |

## Schema

El orden en el SQL Editor es el de `docs/PRODUCT/roadmap.md` (Paso 2) y `docs/Tech/06-config-operacion.md`: `supabase/01-schema.sql`, `supabase/03-contributor-auth.sql`, `supabase/04-editorial-permissions.sql`, `supabase/migrations/20260921000300_editorial_member_management.sql`, `supabase/migrations/20261003150500_private_dwell_media.sql`, `supabase/migrations/20261003231500_rls_revoke_rate_limit.sql`, `supabase/02-seed.sql` solo si se quiere el ejemplo, y el alta del primer `owner` en `editorial_members`. Si `verified_contributors` ya existe sin `auth_user_id`, `03-contributor-auth.sql` va antes de `01-schema.sql`. Producción se migró así el 2026-09-25 y no debe reaplicar `01-schema.sql`. La lectura de aquel día está en `docs/Tech/08-estado-supabase-2026-09-25.md`. El camino único está en `supabase/README.md`.

| Tabla | Clave | Campos relevantes |
|---|---|---|
| `properties` | `slug PK` | name, location, character, description, cover, `images text[]`, `facts jsonb`, architecture, interior, story, `status draft/review/published`, `published_at` |
| `journal_posts` | `slug PK` | title, category, excerpt, image, `date_label`, `reading_time`, `body_mdx` (Fase 2), status, timestamps |
| `verified_contributors` | `handle PK` (`@...`) | `auth_user_id` único, display_name, `source ig/fb/direct` |
| `submissions` | `id uuid` | `author_handle FK`, `image_url`, `caption_raw`, `source form/ig/fb`, `external_id unique`, `rights_granted bool`, `status pending/approved/rejected` |
| `syndications` | `id uuid` | `post_type property/journal`, `post_slug`, `target fb/ig/partner:*`, `external_id/url`, `status queued/published/failed`, índice `(post_type, post_slug)` |
| `editorial_members` | `auth_user_id PK`, FK a `auth.users` | `role owner/moderator`, `active`, `display_name`, timestamps |
| `moderation_events` | `id uuid` | `actor_user_id`, `actor_source` (`auth`; el check aún admite `legacy_admin` por filas viejas), `action` (6 valores), `submission_id`, `target_handle`, `metadata jsonb` |
| `rate_limit_buckets` | `bucket_key PK` | ventana, contador. Solo `service_role`. La clave es un hash |

`supabase/03-contributor-auth.sql` duplica `supabase/migrations/20260921000100_contributor_auth.sql`. `supabase/04-editorial-permissions.sql` duplica `supabase/migrations/20260921000200_editorial_permissions.sql`. `20260921000300` amplía el check de acciones a 6 valores. `supabase/migrations/20261003150500_private_dwell_media.sql` deja `dwell-media` privado y crea `dwell-published`. `supabase/migrations/` no contiene el esquema base, así que `supabase db push` no crea una base vacía. El servidor consulta el miembro activo con `auth_user_id`, `role` y `active`. No usa `user_metadata`.

El 2026-09-25, testing (`ypeizxnafipvojpntsaw`) tenía el SQL canónico, las tres migraciones, `canonical_01_schema` (`20260925174404`), el seed, 3 usuarios Auth y dos `owner` activos. Producción (`sfujmwumtzuzwwhfmyxa`) tenía las mismas siete tablas, el seed, cero usuarios Auth y cero filas en `editorial_members`. En producción `auth_user_id` era la última columna; en testing, la segunda. Producción conservaba `public.rls_auto_enable()` con `EXECUTE` revocado a `anon`, `authenticated` y `public`. Testing no tenía esa función. Los dos proyectos están pausados desde el 2026-10-03. Ese recuento no se ha vuelto a leer.

Seguridad en el SQL del repositorio: RLS forzado, `REVOKE ALL` a `anon`/`authenticated`/`PUBLIC`, y policy `published_read` solo en `properties` y `journal_posts` (`status = 'published'`, sin `body_mdx`). El resto de tablas no tiene policy. `service_role` tiene `BYPASSRLS` y sigue con la cola. Eso está en `20261003231500` y todavía no está aplicado en la base pausada. Hasta aplicarlo, el sitio repite la lectura publicada con `service_role`. Storage: `dwell-media` es privado y no tiene policy de `SELECT`. Los envíos pendientes viven ahí, en `submissions/<uuid>.jpg`, sin el handle en la ruta. El panel los muestra con una URL firmada de 15 minutos. Al aprobar, el servidor copia el JPEG a `dwell-published/<uuid>.jpg` y guarda esa URL pública. Al rechazar, borra el objeto. La escritura de ambos buckets sigue solo con `service_role`. El índice `verified_contributors_auth_user_idx` es redundante con el del `UNIQUE`. Los advisors INFO del 2026-09-25 están en el documento de estado. El cierre del bucket privado está en el repositorio y todavía no está aplicado en la base pausada.

## Seed (`supabase/02-seed.sql`)

Migra los 3 properties + 4 posts de `data.ts` con `status='published'`, `on conflict (slug) do update` (idempotente).

## Medios

- Envío pendiente: `dwell-media/submissions/<uuid>.jpg`. La columna `image_url` guarda esa ruta, no una URL pública. El handle no forma parte del path.
- Envío aprobado: `dwell-published/<uuid>.jpg`. `journal_posts.image` y `submissions.image_url` pasan a la URL pública de ese objeto. `next/image` sigue generando WebP/AVIF al servir.
- Un bucket público de Supabase sirve cualquier objeto cuya URL se conozca. Por eso lo publicado no es un prefijo de `dwell-media`: es otro bucket, y el privado no tiene policy de lectura.
- `next.config.ts` permite `images.unsplash.com` y el hostname de `NEXT_PUBLIC_SUPABASE_URL` en el build. No hay comodín `*.supabase.co`.
- El formulario prepara la foto en el navegador (lado largo ≤ 2560 px, JPEG ≤ 4 MB) y no recomprime un JPEG que ya cabe. Eso no sustituye al servidor. El JPEG se reencodea otra vez antes de guardarlo: se aplica la orientación EXIF y no se escriben GPS ni otros metadatos. El tope de la foto sigue en 4 MB. Vercel corta el cuerpo de la función hacia 4,5 MB; un `Content-Length` por encima de eso responde 413 sin leer el resto.
