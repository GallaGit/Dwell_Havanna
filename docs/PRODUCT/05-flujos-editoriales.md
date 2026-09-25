# 05 — Flujos editoriales (ingesta → moderación → sindicación)

Fuente: `app/contribuir/page.tsx`, `app/api/submissions/route.ts`, `app/admin/review/page.tsx`, `app/sitemap.ts`, `app/feed.xml/route.ts`, `app/embed/[slug]/route.ts`.

## 1. Ingesta curada (colaborador → web)

`Invitación admin` → `Supabase Auth` → `Formulario /contribuir` → `POST /api/submissions` → fila `submissions(status='pending')`. Nada visible al público.

- Form (`app/contribuir/page.tsx`): handle*, title≤140, caption*≤2000, photo* JPEG, checkbox `rights=true`*. Errores en español mapeados por código (`FRIENDLY`).
- Auth (`app/iniciar-sesion/page.tsx`): solo envía enlace OTP a usuarios ya invitados (`shouldCreateUser=false`). No hay registro público.
- API (`app/api/submissions/route.ts`, multipart): exige sesión Auth (401), comprueba el vínculo `verified_contributors.auth_user_id` con el handle enviado (403), valida handle+caption (422), rights (422), photo JPEG (422), ≤8MB (422), sube a `dwell-media/submissions/<handle>/<uuid>.jpg`, `getPublicUrl`, inserta `source='form', rights_granted=true`. Si el insert falla, borra el huérfano (best-effort).
- Contrato detallado ya documentado en `docs/Idea/Fase-1-Cierre.md §2` — no se duplica aquí.

## 2. Moderación (`/admin/review`, criterio humano no automatizable)

`app/admin/review/page.tsx` usa Server Actions y autorización editorial server-side:

1. `getEditorialAccess()`: obtiene el usuario mediante Supabase Auth y busca un miembro activo en `editorial_members`. Si no hay miembro, acepta temporalmente la cookie `dh_admin` cuando `ADMIN_TOKEN` está configurado.
2. Lista `pending order created_at asc` con foto + `author_handle/source/fecha` + texto.
3. `decide`: `reject → status='rejected'`; `approve → insert journal_posts {slug: community-<8primeros id>, title: primera línea ≤90, category: 'Community', excerpt: ≤220, image, date_label: mes y año, reading_time: '3 min', status: 'published', published_at: now}` + `submissions → approved`.
4. Cada aprobación o rechazo escribe un evento en `moderation_events`. La condición `status='pending'` evita procesar dos decisiones sobre el mismo envío.
5. La interfaz pide confirmación antes de enviar cada decisión. El diálogo informa que aprobar publica el contenido y que rechazar lo retira de la cola.
6. Tras aprobar, el servidor revalida `/`, `/journal`, `/journal/<slug>` y `/admin/review`.
7. Invitar (`inviteContributor`) requiere `owner` o el fallback temporal. Un `moderator` no invita. El usuario elige un handle existente y un email. `auth.admin.inviteUserByEmail` crea la cuenta invitada y guarda `auth_user_id`.
8. Estados vacíos: sin acceso → login editorial y, si existe, formulario de token temporal; sin DB → "Sin base de datos".

`inviteContributor` e `inviteEditorialMember` pasan `redirectTo` con `NEXT_PUBLIC_SITE_URL` y `/auth/callback`. Si la variable no está definida, el servidor usa `http://localhost:3000`. Supabase Auth solo completa el enlace si esa URL está en la allowlist de redirecciones. `localhost` abre el enlace en la máquina que ejecuta la app. La confirmación remota queda diferida hasta la URL pública de producción. La plantilla del email tiene que enviar `token_hash` y `type` al callback. El detalle está en `docs/Tech/06-config-operacion.md`.

Los `owner` pueden gestionar el equipo editorial desde el mismo panel: invitar
cuentas `owner` o `moderator`, cambiar roles y activar o desactivar miembros.
Estas acciones se autorizan server-side, se registran en `moderation_events` y
no permiten modificar la propia cuenta ni dejar el sistema sin un `owner` activo.
Los `moderator` y el fallback `ADMIN_TOKEN` no pueden gestionar permisos.

Regla: aprobar publica directamente el envío de comunidad en Journal después de la confirmación editorial. Properties solo los crea la editora.

## 3. Evolución de permisos editoriales

La migración ya está implementada en código y en las migraciones SQL. El panel acepta cuentas editoriales individuales. En testing ya hay un `owner`. `ADMIN_TOKEN` sigue como fallback temporal hasta verificar ese acceso en producción.

El modelo usa una cuenta individual de Supabase para cada miembro editorial:

- `owner`: administra colaboradores, moderadores, permisos y publicación.
- `moderator`: revisa, aprueba y rechaza envíos. No administra permisos.
- `contributor`: envía contenido y espera revisión.

La API seguirá comprobando la sesión y la relación `auth_user_id` ↔ `handle` para todos los contribuidores.

El roadmap define el orden de migración en `docs/PRODUCT/roadmap.md`, sección **Evolución de permisos editoriales**. La migración debe crear primero el modelo de roles, después la autorización server-side y luego los moderadores.

La tabla `moderation_events` guarda la cuenta, la acción, el envío afectado y la fecha de cada decisión de moderación. En testing, la tabla existe y RLS no expone filas mediante la clave publishable.

## 4. Correcciones, retiro y eliminación solicitada

Este flujo está documentado para una fase posterior. No está implementado en el esquema, la API ni la interfaz actuales.

### Envíos pendientes

El colaborador podrá ver sus propios envíos con estado `pending`, editar el texto, reemplazar la imagen o retirar el envío antes de la revisión.

El retiro no debe borrar la fila ni el archivo de forma inmediata. El sistema debe conservar el registro para la auditoría y usar un estado como `withdrawn` o `cancelled`.

### Envíos rechazados

El colaborador podrá ver el motivo del rechazo, corregir el texto o la imagen y reenviar el envío a la cola como `pending`.

La moderación necesitará un campo de nota, como `moderator_note`, para explicar la corrección solicitada.

### Envíos aprobados o publicados

El colaborador no editará directamente un envío aprobado o publicado. Podrá solicitar una corrección o el retiro del contenido.

El equipo editorial decidirá si reabre el envío, actualiza el borrador, retira el contenido o mantiene la publicación.

Una solicitud de retiro debe conservar el historial. El flujo previsto es `published → withdrawal_requested → unpublished`.

### Permisos previstos

| Rol | Ver propios envíos | Editar `pending` | Corregir `rejected` | Solicitar retiro | Aprobar o retirar |
|---|---:|---:|---:|---:|---:|
| `contributor` | Sí | Sí | Sí | Sí | No |
| `moderator` | No aplica | No aplica | No aplica | No aplica | Sí, según la política editorial |
| `owner` | No aplica | No aplica | No aplica | No aplica | Sí |

El colaborador no podrá editar contenido aprobado ni borrar publicaciones directamente. `moderator` y `owner` conservarán la decisión final.

### Modelo de datos pendiente

La implementación futura deberá evaluar estos estados adicionales para `submissions`:

```text
change_requested
withdrawal_requested
withdrawn
unpublished
```

También deberá evaluar `updated_at`, `moderator_note`, `reviewed_by`, `reviewed_at` y `withdrawn_at`.

Las acciones de edición, reenvío, retiro, restauración y despublicación deberán quedar registradas en `moderation_events`.

El borrado físico quedará reservado para solicitudes administrativas o legales. El flujo normal usará estados para conservar el historial.

## 5. Sindicación pull (web → terceros, Fase 1 hecha)

| Pieza | Archivo | Detalle |
|---|---|---|
| OG + canonical por slug | `app/properties/[slug]/page.tsx`, `app/journal/[slug]/page.tsx` (`generateMetadata`) | `alternates.canonical`, OG `article`, Twitter `summary_large_image` con cover/image |
| Sitemap | `app/sitemap.ts` | home, índices, about + slugs, `revalidate 3600` |
| RSS | `app/feed.xml/route.ts` | RSS 2.0 journal+properties con `media:content`, `revalidate 3600` |
| Embed | `app/embed/[slug]/route.ts` | HTML standalone (foto+título+atribución+link) para `<iframe>`, 404 si no existe |

Fase 2 (no empezada, ver `docs/Idea/Plan-Crossposting.md §5`): `POST /api/syndicate` + log `syndications` + App Meta. Fase 3: webhooks ingesta IG/FB.
