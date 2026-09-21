# 05 — Flujos editoriales (ingesta → moderación → sindicación)

Fuente: `site/app/contribuir/page.tsx`, `site/app/api/submissions/route.ts`, `site/app/admin/review/page.tsx`, `site/app/sitemap.ts`, `site/app/feed.xml/route.ts`, `site/app/embed/[slug]/route.ts`.

## 1. Ingesta curada (colaborador → web)

`Invitación admin` → `Supabase Auth` → `Formulario /contribuir` → `POST /api/submissions` → fila `submissions(status='pending')`. Nada visible al público.

- Form (`site/app/contribuir/page.tsx`): handle*, title≤140, caption*≤2000, photo* JPEG, checkbox `rights=true`*. Errores en español mapeados por código (`FRIENDLY`).
- Auth (`site/app/iniciar-sesion/page.tsx`): solo envía enlace OTP a usuarios ya invitados (`shouldCreateUser=false`). No hay registro público.
- API (`site/app/api/submissions/route.ts`, multipart): exige sesión Auth (401), comprueba el vínculo `verified_contributors.auth_user_id` con el handle enviado (403), valida handle+caption (422), rights (422), photo JPEG (422), ≤8MB (422), sube a `dwell-media/submissions/<handle>/<uuid>.jpg`, `getPublicUrl`, inserta `source='form', rights_granted=true`. Si el insert falla, borra el huérfano (best-effort).
- Contrato detallado ya documentado en `docs/Idea/Fase-1-Cierre.md §2` — no se duplica aquí.

## 2. Moderación (`/admin/review`, criterio humano no automatizable)

`site/app/admin/review/page.tsx` usa Server Actions y autorización editorial server-side:

1. `getEditorialAccess()`: obtiene el usuario mediante Supabase Auth y busca un miembro activo en `editorial_members`. Si no hay miembro, acepta temporalmente la cookie `dh_admin` cuando `ADMIN_TOKEN` está configurado.
2. Lista `pending order created_at asc` con foto + `author_handle/source/fecha` + texto.
3. `decide`: `reject → status='rejected'`; `approve → insert journal_posts {slug: community-<8primeros id>, title: primera línea ≤90, category: 'Community', excerpt: ≤220, image, date_label: 'Borrador — revisión', reading_time: '3 min', status: 'review'}` + `submissions → approved`.
4. Cada aprobación o rechazo escribe un evento en `moderation_events`. La condición `status='pending'` evita procesar dos decisiones sobre el mismo envío.
5. Invitar (`inviteContributor`) requiere `owner` o el fallback temporal; el usuario elige un handle existente y un email. `auth.admin.inviteUserByEmail` crea la cuenta invitada y guarda `auth_user_id`.
6. Estados vacíos: sin acceso → login editorial y, si existe, formulario de token temporal; sin DB → "Sin base de datos".

Los `owner` pueden gestionar el equipo editorial desde el mismo panel: invitar
cuentas `owner` o `moderator`, cambiar roles y activar o desactivar miembros.
Estas acciones se autorizan server-side, se registran en `moderation_events` y
no permiten modificar la propia cuenta ni dejar el sistema sin un `owner` activo.
Los `moderator` y el fallback `ADMIN_TOKEN` no pueden gestionar permisos.

Regla: aprobar **nunca publica directo**; los envíos de comunidad van a Journal, Properties solo los crea la editora.

## 3. Evolución de permisos editoriales

La migración ya está implementada en código y en las migraciones SQL. El panel acepta cuentas editoriales individuales y conserva `ADMIN_TOKEN` como fallback temporal hasta validar el primer `owner`.

El modelo usa una cuenta individual de Supabase para cada miembro editorial:

- `owner`: administra colaboradores, moderadores, permisos y publicación.
- `moderator`: revisa, aprueba y rechaza envíos. No administra permisos.
- `trusted_contributor`: puede saltar la cola inicial y crear un borrador automático, pero no publica directamente.
- `contributor`: envía contenido y espera revisión.

La API seguirá comprobando la sesión y la relación `auth_user_id` ↔ `handle` para todos los contribuidores. El permiso de confianza no elimina esa comprobación.

El roadmap define el orden de migración en `docs/PRODUCT/roadmap.md`, sección **Evolución de permisos editoriales**. La migración debe crear primero el modelo de roles, después la autorización server-side, luego los moderadores y, al final, el flujo de confianza.

La tabla `moderation_events` guarda la cuenta, la acción, el envío afectado y la fecha de cada decisión de moderación. En testing, la tabla existe y RLS no expone filas mediante la clave publishable.

## 4. Sindicación pull (web → terceros, Fase 1 hecha)

| Pieza | Archivo | Detalle |
|---|---|---|
| OG + canonical por slug | `site/app/properties/[slug]/page.tsx`, `site/app/journal/[slug]/page.tsx` (`generateMetadata`) | `alternates.canonical`, OG `article`, Twitter `summary_large_image` con cover/image |
| Sitemap | `site/app/sitemap.ts` | home, índices, about + slugs, `revalidate 3600` |
| RSS | `site/app/feed.xml/route.ts` | RSS 2.0 journal+properties con `media:content`, `revalidate 3600` |
| Embed | `site/app/embed/[slug]/route.ts` | HTML standalone (foto+título+atribución+link) para `<iframe>`, 404 si no existe |

Fase 2 (no empezada, ver `docs/Idea/Plan-Crossposting.md §5`): `POST /api/syndicate` + log `syndications` + App Meta. Fase 3: webhooks ingesta IG/FB.
