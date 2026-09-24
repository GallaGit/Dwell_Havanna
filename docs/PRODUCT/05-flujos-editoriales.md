# 05 — Flujos editoriales (ingesta → moderación → sindicación)

Fuente: `app/contribuir/page.tsx`, `app/api/submissions/route.ts`, `app/admin/review/page.tsx`, `app/sitemap.ts`, `app/feed.xml/route.ts`, `app/embed/[slug]/route.ts`.

## 1. Ingesta curada (colaborador → web)

`Invitación admin` → `Supabase Auth` → `Formulario /contribuir` → `POST /api/submissions` → fila `submissions(status='pending')`. Nada visible al público.

- Form (`app/contribuir/page.tsx`): handle*, title≤140, caption*≤2000, photo* JPEG, checkbox `rights=true`*. Errores en español mapeados por código (`FRIENDLY`).
- Auth (`app/iniciar-sesion/page.tsx`): solo envía enlace OTP a usuarios ya invitados (`shouldCreateUser=false`). No hay registro público.
- API (`app/api/submissions/route.ts`, multipart): exige sesión Auth (401), comprueba el vínculo `verified_contributors.auth_user_id` con el handle enviado (403), valida handle+caption (422), rights (422), photo JPEG (422), ≤8MB (422), sube a `dwell-media/submissions/<handle>/<uuid>.jpg`, `getPublicUrl`, inserta `source='form', rights_granted=true`. Si el insert falla, borra el huérfano (best-effort).
- Contrato detallado ya documentado en `docs/Idea/Fase-1-Cierre.md §2` — no se duplica aquí.

## 2. Moderación (`/admin/review`, criterio humano no automatizable)

`app/admin/review/page.tsx` con Server Actions:

1. `login(formData)`: compara `token` con `ADMIN_TOKEN`, set cookie httpOnly `dh_admin` 7 días + `revalidatePath`.
2. Lista `pending order created_at asc` con foto + `author_handle/source/fecha` + texto.
3. `decide`: `reject → status='rejected'`; `approve → insert journal_posts {slug: community-<8primeros id>, title: primera línea ≤90, category: 'Community', excerpt: ≤220, image, date_label: 'Borrador — revisión', reading_time: '3 min', status: 'review'}` + `submissions → approved`.
4. Invitar (`inviteContributor`): el admin autentificado elige un handle existente y un email; `auth.admin.inviteUserByEmail` crea la cuenta invitada y guarda `auth_user_id`.
5. Estados vacíos: sin `ADMIN_TOKEN` → "Panel deshabilitado"; sin DB → "Sin base de datos"; sin login admin → form token.

Regla: aprobar **nunca publica directo**; los envíos de comunidad van a Journal, Properties solo los crea la editora.

## 3. Evolución de permisos editoriales

El panel actual usa un `ADMIN_TOKEN` único. Ese mecanismo sirve para la primera versión, pero no identifica a la persona que revisa ni permite asignar permisos distintos.

La evolución prevista usa una cuenta individual de Supabase para cada miembro editorial:

- `owner`: administra colaboradores, moderadores, permisos y publicación.
- `moderator`: revisa, aprueba y rechaza envíos. No administra permisos.
- `trusted_contributor`: puede saltar la cola inicial y crear un borrador automático, pero no publica directamente.
- `contributor`: envía contenido y espera revisión.

La API seguirá comprobando la sesión y la relación `auth_user_id` ↔ `handle` para todos los contribuidores. El permiso de confianza no elimina esa comprobación.

El roadmap define el orden de migración en `docs/PRODUCT/roadmap.md`, sección **Evolución de permisos editoriales**. La migración debe crear primero el modelo de roles, después la autorización server-side, luego los moderadores y, al final, el flujo de confianza.

La tabla de auditoría prevista guardará la cuenta, la acción, el envío afectado y la fecha de cada decisión de moderación.

## 4. Sindicación pull (web → terceros, Fase 1 hecha)

| Pieza | Archivo | Detalle |
|---|---|---|
| OG + canonical por slug | `app/properties/[slug]/page.tsx`, `app/journal/[slug]/page.tsx` (`generateMetadata`) | `alternates.canonical`, OG `article`, Twitter `summary_large_image` con cover/image |
| Sitemap | `app/sitemap.ts` | home, índices, about + slugs, `revalidate 3600` |
| RSS | `app/feed.xml/route.ts` | RSS 2.0 journal+properties con `media:content`, `revalidate 3600` |
| Embed | `app/embed/[slug]/route.ts` | HTML standalone (foto+título+atribución+link) para `<iframe>`, 404 si no existe |

Fase 2 (no empezada, ver `docs/Idea/Plan-Crossposting.md §5`): `POST /api/syndicate` + log `syndications` + App Meta. Fase 3: webhooks ingesta IG/FB.
