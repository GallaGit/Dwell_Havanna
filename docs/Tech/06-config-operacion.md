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

`scripts/apply-canonical-sql.sh --apply` exige `DATABASE_URL` y `psql`. Si la URL contiene el ref de producción `sfujmwumtzuzwwhfmyxa`, el script se niega salvo `--allow-production`. No lo ejecutes contra producción desde un agente. Cada archivo va en una sola transacción (`psql --single-transaction` y `ON_ERROR_STOP`). Si una sentencia falla, ese archivo se revierte y el script no sigue con el siguiente. El alta del primer `owner` queda fuera del script, con el `auth_user_id` real.

Verificación de la preparación de código del PR #9: `lint`, `test` (17 pasan, 1 E2E omitido) y `build`. El detalle de Lighthouse está en `docs/Tech/07-rendimiento.md`. El estado de las bases al 2026-09-25 está en `docs/Tech/08-estado-supabase-2026-09-25.md`.

## Activación (lado humano)

Hosting, dominio y variables están en `docs/PRODUCT/roadmap.md`, Paso 2. Producción (`sfujmwumtzuzwwhfmyxa`, Dwell_Havanna_DB) ya tiene el SQL aplicado. No lo repitas.

### Orden SQL

Hay dos puntos de partida. El script usa el primero.

Base nueva, sin tablas:

1. `supabase/01-schema.sql`. Crea `verified_contributors` ya con `auth_user_id`, así que el índice `verified_contributors_auth_user_idx` existe.
2. `supabase/03-contributor-auth.sql`. La columna ya está; `add column if not exists` no cambia la tabla.
3. `supabase/04-editorial-permissions.sql`.
4. `supabase/migrations/20260921000300_editorial_member_management.sql`. Amplía el check de `moderation_events.action` a 6 acciones.
5. `supabase/02-seed.sql`, solo si se quiere el contenido de ejemplo.
6. Invitar al usuario en Auth y, después, dar de alta el primer `owner`.

Esquema anterior a `03`: `verified_contributors` existe y no tiene `auth_user_id`. `01-schema.sql` hace `create table if not exists` y se salta la tabla. El `create index` de `verified_contributors_auth_user_idx` falla con `column "auth_user_id" does not exist`. En ese caso el orden es:

1. `supabase/03-contributor-auth.sql`.
2. `supabase/01-schema.sql`.
3. `supabase/04-editorial-permissions.sql`.
4. `supabase/migrations/20260921000300_editorial_member_management.sql`.
5. El seed, solo si esas filas no están ya. En producción el seed del 2026-09-15 se conservó.
6. El `owner`, después de crear el usuario en Auth.

Producción se migró el 2026-09-25 20:25–20:26 CEST con este segundo orden, más el borrado de los 2 colaboradores de prueba y el `revoke` de `rls_auto_enable()`. Los archivos están en `supabase/prod-applied/2026-09-25/`. Hoy `auth_user_id` ya existe, así que el orden de una base nueva también es idempotente allí.

`supabase db push` y `supabase db reset` no sirven para crear una base: `supabase/migrations/` no incluye `01-schema.sql` y no hay `supabase/config.toml`. Antes de un `db push` contra producción o testing hay que alinear el historial con `supabase migration repair`. Ese procedimiento está en `docs/Tech/08-estado-supabase-2026-09-25.md`. `repair` solo cambia la tabla de historial.

Después del SQL:

1. Alta de colaborador: `insert into verified_contributors (handle, display_name, source) values ('@arq.habana','Nombre','ig');`
2. Desde `/admin/review`, entra con la cuenta `owner` e invita el email del colaborador usando el handle existente. `ADMIN_TOKEN` solo cubre esa invitación si la cuenta `owner` no está disponible.
3. El colaborador abre el enlace recibido. No existe registro público. La plantilla del email tiene que incluir `token_hash` y `type`, como arriba.
4. Probar: `/contribuir` → enviar → `/admin/review` → confirmar la aprobación → ver el post en `/journal` con `journal_posts.status='published'`.
5. Fijar `NEXT_PUBLIC_SITE_URL` al dominio real antes de compartir. Site URL `https://<dominio>`. Allowlist `https://<dominio>/auth/callback`.
6. En testing hay dos `owner` activos. En un proyecto nuevo, el paso 6 del orden SQL inserta la primera cuenta, después de invitarla en Auth. No promuevas el colaborador E2E. En producción esa fila todavía no existe: la cuenta es la de Ociel.
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

## Variables en Vercel

El proyecto ya está subido a Vercel. El despliegue y las variables no están verificados, y falta la URL. Cuando se confirmen, usa las mismas claves de `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_TOKEN` son secretos de servidor. `NEXT_PUBLIC_*` se incrustan en el cliente en el build. `NEXT_PUBLIC_SITE_URL` es `https://dwellhavana.com` (o el host real, sin barra final).

## Seguridad mínima

- `service_role` y `ADMIN_TOKEN` jamás salen del servidor (`lib/db.ts` y admin son server-only). La publishable key sí puede llegar al navegador.
- `POST /api/submissions` exige una sesión Supabase Auth y comprueba que el usuario esté vinculado al handle enviado mediante `verified_contributors.auth_user_id`.
- La columna y el índice de vínculo están en `supabase/01-schema.sql` y, para una tabla vieja, en `supabase/03-contributor-auth.sql`. En el esquema anterior a `03`, ese archivo va antes de `01-schema.sql`. Producción se migró así el 2026-09-25. El índice `verified_contributors_auth_user_idx` repite el que ya crea el `UNIQUE`; es deuda conocida, documentada en `docs/Tech/08-estado-supabase-2026-09-25.md`.
- El E2E HTTP se activa solo con variables `E2E_*` de un proyecto de testing dedicado; `E2E_AUTH_COOKIE` representa la sesión de un colaborador invitado y nunca debe apuntar a producción.
- RLS sin policies + bucket escritura solo `service_role` (ver `04`).
- Solo JPEG ≤8MB, `rights_granted` obligatorio, allowlist estricta, limpieza de huérfanos en API.
- Free tier estimado: ~200 fotos ≈ 60MB, sobra para arranque.
- `ADMIN_TOKEN` queda como fallback temporal hasta validar el primer `owner` en producción. Su cookie expira por defecto en 7 días y puede ajustarse con `ADMIN_TOKEN_TTL_SECONDS`; revocar el token requiere cambiar el secreto.
