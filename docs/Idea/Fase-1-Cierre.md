# Fase 1 — Cierre (2026-09-15)

Estado: **implementada y verificada en local** (`lint` + `build` verdes, 19 rutas).
Commits en `GallaGit/Dwell_Havanna` rama `main`:
- `9c7d391` fundación (schema, seed, capa de contenido con fallback)
- `a6fdcbb` cierre (este documento describe ese commit)

Pendiente NO técnico: crear el proyecto Supabase y aplicar los SQL (ver §6).
Sin DB configurada el sitio funciona igual (fallback estático de `lib/data.ts`).

## 1. Qué se construyó

### 1.1 Sindicación pull (web → terceros)
| Pieza | Archivo | Notas |
|---|---|---|
| URL canónica | `site/lib/site.ts` | `siteUrl` desde `NEXT_PUBLIC_SITE_URL` (fallback `https://dwellhavana.com`), helper `canonicalFor(path)` |
| OG + canonical por propiedad | `site/app/properties/[slug]/page.tsx` (`generateMetadata`) | title, description, `alternates.canonical`, OpenGraph article + Twitter summary_large_image con `cover` |
| OG + canonical por post | `site/app/journal/[slug]/page.tsx` (`generateMetadata`) | idem con `image` del post |
| Sitemap | `site/app/sitemap.ts` | home, índices, about + todos los slugs publicados; `revalidate 3600` |
| RSS | `site/app/feed.xml/route.ts` | RSS 2.0 con journal + properties, incluye `media:content` con la imagen; `revalidate 3600` |
| Embed terceros | `site/app/embed/[slug]/route.ts` | HTML standalone (foto + título + atribución + link) para `<iframe>` en blogs/páginas partner; resuelve properties y journal; 404 si no existe |

### 1.2 Ingesta curada (colaborador → web)
| Pieza | Archivo | Notas |
|---|---|---|
| Formulario | `site/app/contribuir/page.tsx` | client component: handle, título opcional, texto, foto, checkbox de derechos; mensajes de error en español mapeados por código |
| API | `site/app/api/submissions/route.ts` | `POST` multipart; ver §2 |
| Moderación | `site/app/admin/review/page.tsx` | login por `ADMIN_TOKEN` (cookie httpOnly `dh_admin`, 7 días); lista pendientes con foto+texto; **aprobar → crea borrador en `journal_posts` (`status='review'`, categoría Community)**; rechazar → `rejected`; ver §3 |

### 1.3 Decisión de fotos (implementada)
Responde a "¿qué DB es buena para fotos?": binarios en **Supabase Storage**, metadatos en **Postgres**.
- Bucket `dwell-media` público-lectura, escritura solo `service_role` (ver `supabase/01-schema.sql`).
- Validación en API: **solo JPEG, ≤ 8 MB**, handle obligatorio, texto obligatorio, `rights` obligatorio.
- Se guarda el **original** en `submissions/<handle>/<uuid>.jpg`; las variantes las genera `next/image` al servir (WebP/AVIF + responsive). `next.config.ts` ya acepta `*.supabase.co`.
- RLS activado en las 5 tablas **sin policies** (defensa en profundidad: con `service_role` todo funciona; `anon`/`authenticated` no ven nada aunque la Data API exponga una tabla por error).
- Estimación de capacidad free tier (1GB + 2GB transferencia): ~200 fotos optimizadas ≈ 60MB. Sobra para el arranque.

## 2. API `POST /api/submissions` — contrato
Content-Type `multipart/form-data`: `handle*`, `caption*` (máx 2000), `title` (máx 140, opcional), `rights` (`true`/`on`*), `photo*` (JPEG ≤8MB).
Respuestas: `200 {ok:true, id}` · `400 bad_form` · `422 handle_and_caption_required | rights_required | photo_required | photo_must_be_jpeg | photo_too_large_8mb` · `403 unknown_contributor` (no está en `verified_contributors`) · `500 upload_failed | save_failed` · `503 db_not_configured` (sin Supabase).
Si el insert falla tras subir, borra el archivo huérfano (best-effort).

## 3. Flujo editorial (el criterio humano no se automatiza)
1. Colaborador verificado envía en `/contribuir` → fila `pending` (nada visible al público).
2. Editora entra a `/admin/review` con el token → ve foto + texto + autor.
3. **Aprobar** = borrador en Journal (`review`) para editar título/texto antes de publicar. **Nunca publica directo.**
4. Al publicar el borrador (cambiar a `published` en DB), aparece en web con ISR ≤1h; Fase 2 lo empujará a FB/IG.
5. Los envíos aprobados de comunidad van al Journal, no a Properties (las propiedades las crea la editora).

## 4. Variables de entorno (`.env.example` actualizado)
`NEXT_PUBLIC_SITE_URL` · `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `ADMIN_TOKEN`. Copiar a `.env.local` (gitignoreado). Solo `NEXT_PUBLIC_*` llega al navegador; `service_role` y `ADMIN_TOKEN` jamás salen del servidor.

## 5. Verificación hecha
`npm run lint` ✓ · `npm run build` ✓ — 19 rutas: 7 properties/journal por slug (SSG+ISR 1h), sitemap, feed, contribuir, admin (estáticas), api submissions y embed (dinámicas). Rutas nuevas con DB ausente responden con fallback/mensajes, sin romper el build.

## 6. Qué falta para activar (lado humano, ~30 min)
1. Crear proyecto Supabase → copiar URL + keys a `.env.local` (+ `ADMIN_TOKEN` inventado, largo).
2. SQL Editor: correr `site/supabase/01-schema.sql`, `03-contributor-auth.sql` y luego `02-seed.sql`.
3. Dar de alta colaboradores: `insert into verified_contributors (handle, display_name, source) values ('@arq.habana','Nombre','ig');`
4. Invitar el email desde `/admin/review`; no existe registro público.
5. El colaborador abre el enlace y prueba `/contribuir` → enviar → `/admin/review` → aprobar → ver borrador en DB.
6. `NEXT_PUBLIC_SITE_URL` con el dominio real antes de compartir (si no, OG/sitemap apuntan a `https://dwellhavana.com` por defecto).
7. Validadores: Meta Sharing Debugger (un slug de property y uno de journal) + `/feed.xml` + `/sitemap.xml` en producción.

## 7. Siguiente (Fase 2, no empezada)
`POST /api/syndicate` (cola + reintentos, preview FB vs IG, log en `syndications`) + checklist app Meta del plan (cuenta IG Profesional, Page vinculada, PPA, App Review). Requiere Fase 1 activa en producción.

## 8. Prueba end-to-end (2026-09-15, proyecto `sfujmwumtzuzwwhfmyxa`) — TODO ✅
1. **Lectura `service_role`**: 2 colaboradores + 3 propiedades seed visibles. ✅
2. **RLS con key pública**: `anon` devuelve `[]` en contributors y properties. ✅
3. **Envío real** `POST /api/submissions` (handle `@gallados_lab` + JPEG 197KB + derechos): `200 {ok:true}`, archivo en `dwell-media/submissions/gallados-lab/<uuid>.jpg`. ✅ (Primer intento dio `403` por dev server rancio anterior al `.env` final; con server fresco funciona.)
4. **Moderación** `/admin/review` (login cookie + lista + server action aprobar): submission → `approved`, borrador `community-*` en `journal_posts` con `status='review'`. ✅
5. **Lectura DB en vivo**: marcador publicado aparece en `/properties`; `/feed.xml` 8 items; `/sitemap.xml` con slugs; OG tags correctos por slug. ✅
6. **Limpieza**: borrados marcador, envío, borrador y archivo del bucket. DB = seed original, bucket vacío, `pending` vacío. ✅
Notas de entorno local: la red intercepta TLS y Node falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (curl sí valida con el almacén de Windows); las pruebas usaron `NODE_TLS_REJECT_UNAUTHORIZED=0` **solo en el proceso de test**, nada commiteado. En producción no aplica.
