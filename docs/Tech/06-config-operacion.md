# 06 — Configuración y operación

Fuente: `.env.example`, `.gitignore`, `package.json`, `docs/Idea/Fase-1-Cierre.md §6`.

Las decisiones de producto y el orden de las fases están en `docs/PRODUCT/roadmap.md`. Esta página solo documenta configuración y operación técnica.

## Variables de entorno

Copiar `.env.example` → `.env.local` (gitignoreado, nunca commitear).

| Var | Expuesta al navegador | Dónde se usa |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sí | `lib/site.ts` (OG, sitemap, feed, embeds). También `redirectTo` de las invitaciones Auth. Si falta, el sitio canónico usa `https://dwellhavana.com` y las invitaciones usan `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | `lib/db.ts` y el cliente Auth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí | Supabase Auth en el navegador y cookies SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | **No, solo server** | `lib/db.ts`, API submissions, admin e invitaciones |
| `ADMIN_TOKEN` | **No, solo server** | `app/admin/review/page.tsx` (cookie `dh_admin`) |
| `ADMIN_TOKEN_TTL_SECONDS` | **No, solo server** | Duración de la cookie fallback; default 7 días |
| `SUPABASE_FETCH_TIMEOUT_MS` | No | Timeout opcional de las lecturas a Supabase, en milisegundos. Si falta o no es un número positivo, el default es 5000. No lo lee el cliente del navegador |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Sí | `mailto` de `/about` y del footer. Si falta, `hola@dwellhavana.example` |

> Nota: `docs/Idea/Fase-1-Cierre.md §4` cita `NEXT_PUBLIC_SUPABASE_ANON_KEY`; el `.env.example` actual usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nuevo formato Supabase). Manda el `.env.example`.

## Enlaces de invitación

`inviteUserByEmail` arma `redirectTo` con `NEXT_PUBLIC_SITE_URL` y `/auth/callback?next=…`. Si la variable no está definida, usa `http://localhost:3000`. Supabase Auth completa el enlace solo si esa URL está en la allowlist. En producción la Site URL es `https://<dominio>` y la allowlist incluye `https://<dominio>/auth/callback`.

`localhost` funciona en la máquina que ejecuta la app. No sirve para un invitado en otro equipo.

`/iniciar-sesion` pide un enlace nuevo con `window.location.origin`. Si abres la app en `localhost`, ese enlace también apunta a `localhost`. El parámetro `next` pasa por `lib/safe-redirect.ts`: solo se acepta un path relativo del mismo origen. Si no lo es, el destino es `/contribuir`.

`app/auth/callback/route.ts` acepta dos retornos:

- `?code=`, el flujo PKCE de `signInWithOtp` abierto en el mismo navegador. `@supabase/ssr` usa `flowType: "pkce"`.
- `?token_hash=` y `?type=`, para `supabase.auth.verifyOtp`. Los `type` admitidos son `signup`, `invite`, `magiclink`, `recovery`, `email_change` y `email`.

La plantilla por defecto (`{{ .ConfirmationURL }}`) verifica el token en Supabase y luego redirige. Sin verificador PKCE, como en `inviteUserByEmail`, esa redirección deja la sesión en el fragmento (`#access_token`). El Route Handler no lee el fragmento. Las plantillas Invite user y Magic Link tienen que apuntar al callback conservando `{{ .RedirectTo }}`:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite">Aceptar invitación</a>
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink">Entrar</a>
```

`RedirectTo` ya trae la query (`/auth/callback?next=/contribuir` o `next=/admin/review`), así que `token_hash` y `type` se añaden con `&`.

## Scripts

```bash
npm run dev                 # desarrollo
npm run build               # SSG+ISR; no necesita secretos reales
npm run start               # producción local
npm run lint                # eslint next core-web-vitals + typescript
npm test                    # unit tests; el E2E HTTP se omite sin E2E_*
npm run test:editorial-auth # solo la política de roles
scripts/apply-canonical-sql.sh            # lista el SQL; no conecta
scripts/apply-canonical-sql.sh --with-seed
```

`scripts/apply-canonical-sql.sh --apply` exige `DATABASE_URL` y `psql`. Si la URL contiene el ref de producción `sfujmwumtzuzwwhfmyxa`, el script se niega salvo `--allow-production`. No lo ejecutes contra producción desde un agente. El alta del primer `owner` queda fuera del script, con el `auth_user_id` real.

Verificación de esta preparación: `lint`, `test` (32 pasan, 1 E2E omitido) y `build`. El detalle de Lighthouse está en `docs/Tech/07-rendimiento.md`.

## Activación (lado humano)

Hosting, dominio y variables están en `docs/PRODUCT/roadmap.md`, Paso 2. El orden SQL es el mismo que en ese paso y en `docs/Idea/Fase-1-Cierre.md` §6.

Orden SQL de un proyecto de producción, en el SQL Editor:

1. `supabase/01-schema.sql`
2. `supabase/03-contributor-auth.sql`
3. `supabase/04-editorial-permissions.sql`
4. `supabase/migrations/20260921000300_editorial_member_management.sql`
5. `supabase/migrations/20261003150500_private_dwell_media.sql`
6. `supabase/02-seed.sql`, solo si se quiere el contenido de ejemplo
7. Alta del primer `owner` en `editorial_members` con su `auth_user_id`

El 2026-09-15 el proyecto `sfujmwumtzuzwwhfmyxa` ya tenía el esquema inicial, el seed, colaboradores y el bucket `dwell-media` **público**. Ese proyecto ahora no resuelve. Esas piezas quedan a re-verificar. No vuelvas a dejar el bucket público: el `INSERT ... ON CONFLICT DO NOTHING` antiguo no cambiaba el flag, y `20261003150500_private_dwell_media.sql` sí hace `UPDATE ... SET public = false`.

## Reactivar producción con el bucket privado

No hace falta ninguna variable nueva en Vercel ni en Supabase. `SUPABASE_SERVICE_ROLE_KEY` sigue siendo la que firma las URLs del panel y la que copia la foto al bucket público.

Si el proyecto ya tenía el SQL anterior, no reapliques `01-schema.sql`. En el SQL Editor ejecuta solo `supabase/migrations/20261003150500_private_dwell_media.sql`. En un proyecto vacío usa el orden completo de arriba: el paso 5 repite el cierre del bucket y es idempotente.

Ese SQL no mueve archivos. Hasta que no corras el script de objetos, las fotos aprobadas siguen en `dwell-media/submissions/<handle>/<uuid>.jpg` y dejan de ser descargables, porque el bucket pasa a privado.

1. Reactiva el proyecto Supabase.
2. Aplica el SQL del párrafo anterior.
3. Revisa el plan, sin escribir:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node --experimental-strip-types scripts/migrate-dwell-media-objects.mjs
```

4. Si el plan es el esperado, repite con `--apply`. El ref `sfujmwumtzuzwwhfmyxa` exige además `--allow-production`.
5. Despliega esta revisión de la app.

Qué hace `--apply` con cada fila de `submissions`:

| Estado | Ruta vieja | Qué pasa |
|---|---|---|
| `pending` | `dwell-media/submissions/<handle>/<uuid>.jpg` | Se mueve a `dwell-media/submissions/<uuid>.jpg`. `image_url` pasa a ser esa ruta. Sigue privada. |
| `approved` | la misma, u otra URL de `dwell-media` | Se reencodea sin EXIF y se sube a `dwell-published/<uuid>.jpg`. Se actualizan `submissions.image_url` y el `journal_posts.image` que aún apunte a la URL vieja o al slug `community-<8 primeros del id>`. Se borra el original. |
| `rejected` | objeto aún en `dwell-media` | Se borra el archivo. La fila se queda. |
| ya migrado | `submissions/<uuid>.jpg` o `dwell-published/<uuid>.jpg` | No se toca. |

El handle sale de la ruta. El UUID del archivo se conserva, así que la pieza publicada cambia de bucket y de prefijo, no de nombre de fichero.

Comprueba, con la clave publishable y sin sesión:

- `GET` de una URL antigua `/object/public/dwell-media/submissions/...` no devuelve la foto.
- El panel, con sesión editorial, muestra la pendiente: la etiqueta `img` apunta a `/storage/v1/object/sign/dwell-media/...`, no a `/object/public/`.
- Rechazar un envío de prueba borra el objeto en Storage.
- Aprobar otro deja un JPEG en `dwell-published` y el post del Journal carga esa URL.
- Un JPEG de más de 4 MB recibe `422 photo_too_large`. Un cuerpo de más de 4,5 MB recibe `413 body_too_large`.

Después del SQL:

1. Alta de colaborador: `insert into verified_contributors (handle, display_name, source) values ('@arq.habana','Nombre','ig');`
2. Desde `/admin/review`, entra con la cuenta `owner` e invita el email del colaborador usando el handle existente. `ADMIN_TOKEN` solo cubre esa invitación si la cuenta `owner` no está disponible.
3. El colaborador abre el enlace recibido. No existe registro público. La plantilla del email tiene que incluir `token_hash` y `type`, como arriba.
4. Probar: `/contribuir` → enviar → `/admin/review` → confirmar la aprobación → ver el post en `/journal` con `journal_posts.status='published'`.
5. Fijar `NEXT_PUBLIC_SITE_URL` al dominio real antes de compartir. Site URL `https://<dominio>`. Allowlist `https://<dominio>/auth/callback`.
6. En testing ya hay un `owner` activo, distinto del usuario E2E. En un proyecto nuevo, el paso 6 del orden SQL inserta esa cuenta. No promuevas el colaborador E2E.
7. Validar `/iniciar-sesion?next=/admin/review`, una decisión de moderación y su fila en `moderation_events`.
8. Validar: Meta Sharing Debugger (1 property + 1 journal) + `/feed.xml` + `/sitemap.xml` en producción.

La política de autorización editorial puede verificarse sin levantar Next.js ni
reutilizar cookies o estado del servidor de desarrollo con:

```bash
npm run test:editorial-auth
```

## Cabeceras y proxy

`next.config.ts` añade en todas las rutas `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy` sin cámara, micrófono ni geolocalización.

`proxy.ts` pone `X-Frame-Options: SAMEORIGIN` y `frame-ancestors 'self'`, salvo en `/embed`, que solo lleva `frame-ancestors *` para que un tercero pueda usar el iframe. `X-Frame-Options` no va en `next.config.ts`: esa cabecera también alcanzaría al embed.

Si la petición no trae cookie `sb-<ref>-auth-token` (ni un trozo `.0`), el proxy no llama a Supabase Auth. Una visita anónima a una página pública no refresca sesión. Si la cookie existe, el refresco sigue en todas las rutas del matcher, incluidas las públicas.

Las lecturas públicas usan `getPublishedContentClient()` (`lib/db.ts`): `fetch` con `next: { revalidate: 3600, tags: ["published-content"] }`. `getServiceClient()` sigue en `cache: "no-store"` para la cola y las mutaciones. Al aprobar, el panel llama a `updateTag("published-content")`.

Esas lecturas, el cliente de servidor y el proxy abortan el fetch a los 5 s, o a `SUPABASE_FETCH_TIMEOUT_MS` si es un número positivo. Si una lectura pública agota el tiempo, `lib/content.ts` la trata como cualquier otro error y usa el dataset estático de `lib/data.ts`: la portada, el journal, properties, el feed, el sitemap y el embed no responden 500. Ese fallback enseña el contenido de ejemplo. Hay que revisarlo antes de lanzar, porque un corte de Supabase puede publicar placeholders como si fueran la revista.

La subida de una foto (`POST`/`PUT` a `/storage/v1/object/<bucket>/<archivo>`) y la descarga del JPEG al copiarlo a `dwell-published` esperan 60 s. Firmar la URL del panel (`/object/sign/…`) y borrar al rechazar siguen en el timeout corto. `signInWithOtp` en el navegador espera 20 s y no usa el timeout corto.

## Variables en Vercel

Cuando exista el proyecto, configura las mismas claves de `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_TOKEN` son secretos de servidor. `NEXT_PUBLIC_*` se incrustan en el cliente en el build. `NEXT_PUBLIC_SITE_URL` es `https://dwellhavana.com` (o el host real, sin barra final).

## Seguridad mínima

- `service_role` y `ADMIN_TOKEN` jamás salen del servidor (`lib/db.ts` y admin son server-only). La publishable key sí puede llegar al navegador.
- `POST /api/submissions` exige una sesión Supabase Auth y comprueba que el usuario esté vinculado al handle enviado mediante `verified_contributors.auth_user_id`.
- La columna y el índice de vínculo se crean con `supabase/03-contributor-auth.sql` si el proyecto ya ejecutó el esquema inicial.
- El E2E HTTP se activa solo con variables `E2E_*` de un proyecto de testing dedicado; `E2E_AUTH_COOKIE` representa la sesión de un colaborador invitado y nunca debe apuntar a producción.
- RLS sin policies. `dwell-media` es privado y no tiene policy de `SELECT`. `dwell-published` es público y solo recibe la copia aprobada. La escritura de ambos es solo `service_role` (ver `04`).
- Solo JPEG de hasta 4 MB, sin EXIF, `rights_granted` obligatorio, allowlist estricta, limpieza de huérfanos en API. Un cuerpo por encima de 4,5 MB se rechaza antes de leerlo entero. El formulario reduce la foto antes del POST; el servidor mantiene estos topes.
- Free tier estimado: ~200 fotos ≈ 60MB, sobra para arranque.
- `ADMIN_TOKEN` queda como fallback temporal hasta validar el primer `owner` en producción. Su cookie expira por defecto en 7 días y puede ajustarse con `ADMIN_TOKEN_TTL_SECONDS`; revocar el token requiere cambiar el secreto.
