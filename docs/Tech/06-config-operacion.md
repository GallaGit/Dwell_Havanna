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

`inviteUserByEmail` arma `redirectTo` con `NEXT_PUBLIC_SITE_URL` y `/auth/callback`. Si la variable no está definida, usa `http://localhost:3000`. Supabase Auth completa el enlace solo si esa URL está en la allowlist de redirecciones del proyecto.

`localhost` funciona en la máquina que ejecuta la app. No sirve para un invitado en otro equipo. La confirmación remota queda diferida hasta configurar la URL pública de producción y permitirla en Supabase Auth.

`/iniciar-sesion` pide un enlace nuevo con `window.location.origin`. Si abres la app en `localhost`, ese enlace también apunta a `localhost`.

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

## Activación (~30 min, lado humano)

1. Crear proyecto Supabase → copiar URL + keys + inventar `ADMIN_TOKEN` largo en `.env.local`.
2. SQL Editor: correr `supabase/01-schema.sql`, luego `supabase/02-seed.sql`.
3. Alta editorial: `insert into verified_contributors (handle, display_name, source) values ('@arq.habana','Nombre','ig');`
4. Desde `/admin/review`, entra con la cuenta `owner` e invita el email del colaborador usando el handle existente. `ADMIN_TOKEN` solo cubre esa invitación si la cuenta `owner` no está disponible.
5. El colaborador abre el enlace recibido. No existe registro público.
6. Probar: `/contribuir` → enviar → `/admin/review` → confirmar la aprobación → ver el post en `/journal` con `journal_posts.status='published'`.
7. Fijar `NEXT_PUBLIC_SITE_URL` al dominio real antes de compartir, y añadir esa URL a la allowlist de redirecciones de Supabase Auth.
8. En testing ya hay un `owner` activo, distinto del usuario E2E. En un proyecto nuevo, inserta esa cuenta como `owner` en `editorial_members`. No promuevas el colaborador E2E.
9. Validar `/iniciar-sesion?next=/admin/review`, una decisión de moderación y su fila en `moderation_events`.
10. Validar: Meta Sharing Debugger (1 property + 1 journal) + `/feed.xml` + `/sitemap.xml` en producción.

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
