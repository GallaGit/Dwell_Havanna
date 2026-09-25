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
npm run build               # SSG+ISR
npm run start               # producción
npm run lint                # eslint next core-web-vitals + typescript
npm test                    # unit tests; el E2E HTTP se omite sin E2E_*
npm run test:editorial-auth # solo la política de roles
```

Verificación Fase 1: `lint ✓` + `build ✓`.

## Activación (lado humano)

Hosting, dominio y variables están en `docs/PRODUCT/roadmap.md`, Paso 2. El orden SQL es el mismo que en ese paso y en `docs/Idea/Fase-1-Cierre.md` §6.

Orden SQL de un proyecto de producción, en el SQL Editor:

1. `supabase/01-schema.sql`
2. `supabase/03-contributor-auth.sql`
3. `supabase/04-editorial-permissions.sql`
4. `supabase/migrations/20260921000300_editorial_member_management.sql`
5. `supabase/02-seed.sql`, solo si se quiere el contenido de ejemplo
6. Alta del primer `owner` en `editorial_members` con su `auth_user_id`

El 2026-09-15 el proyecto `sfujmwumtzuzwwhfmyxa` ya tenía el esquema inicial, el seed, colaboradores y el bucket `dwell-media`. Ese proyecto ahora no resuelve. Esas piezas quedan a re-verificar.

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

## Seguridad mínima

- `service_role` y `ADMIN_TOKEN` jamás salen del servidor (`lib/db.ts` y admin son server-only). La publishable key sí puede llegar al navegador.
- `POST /api/submissions` exige una sesión Supabase Auth y comprueba que el usuario esté vinculado al handle enviado mediante `verified_contributors.auth_user_id`.
- La columna y el índice de vínculo se crean con `supabase/03-contributor-auth.sql` si el proyecto ya ejecutó el esquema inicial.
- El E2E HTTP se activa solo con variables `E2E_*` de un proyecto de testing dedicado; `E2E_AUTH_COOKIE` representa la sesión de un colaborador invitado y nunca debe apuntar a producción.
- RLS sin policies + bucket escritura solo `service_role` (ver `04`).
- Solo JPEG ≤8MB, `rights_granted` obligatorio, allowlist estricta, limpieza de huérfanos en API.
- Free tier estimado: ~200 fotos ≈ 60MB, sobra para arranque.
- `ADMIN_TOKEN` queda como fallback temporal hasta validar el primer `owner` en producción. Su cookie expira por defecto en 7 días y puede ajustarse con `ADMIN_TOKEN_TTL_SECONDS`; revocar el token requiere cambiar el secreto.
