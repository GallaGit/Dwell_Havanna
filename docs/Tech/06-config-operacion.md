# 06 — Configuración y operación

Fuente: `.env.example`, `.gitignore`, `package.json`, `docs/Idea/Fase-1-Cierre.md §6`.

Las decisiones de producto y el orden de las fases están en `docs/PRODUCT/roadmap.md`. Esta página solo documenta configuración y operación técnica.

## Variables de entorno

Copiar `.env.example` → `.env.local` (gitignoreado, nunca commitear).

| Var | Expuesta al navegador | Dónde se usa |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Sí | `lib/site.ts` (OG, sitemap, feed, embeds). Default `https://dwellhavana.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | `lib/db.ts` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí | Reservada cliente (hoy el server usa service_role) |
| `SUPABASE_SERVICE_ROLE_KEY` | **No, solo server** | `lib/db.ts`, API submissions, admin e invitaciones |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí, publishable | Supabase Auth en navegador y cookies SSR |
| `ADMIN_TOKEN` | **No, solo server** | `app/admin/review/page.tsx` (cookie `dh_admin`) |

> Nota: `docs/Idea/Fase-1-Cierre.md §4` cita `NEXT_PUBLIC_SUPABASE_ANON_KEY`; el `.env.example` actual usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nuevo formato Supabase). Manda el `.env.example`.

## Scripts

```bash
npm run dev   # desarrollo
npm run build # SSG+ISR (19 rutas con fallback sin DB)
npm run start # producción
npm run lint  # eslint next core-web-vitals + typescript
```

Verificación Fase 1: `lint ✓` + `build ✓`.

## Activación (~30 min, lado humano)

1. Crear proyecto Supabase → copiar URL + keys + inventar `ADMIN_TOKEN` largo en `.env.local`.
2. SQL Editor: correr `supabase/01-schema.sql`, luego `supabase/02-seed.sql`.
3. Alta editorial: `insert into verified_contributors (handle, display_name, source) values ('@arq.habana','Nombre','ig');`
4. Desde `/admin/review`, invitar el email del colaborador usando el handle existente.
5. El colaborador abre el enlace recibido en `/iniciar-sesion`; no existe registro público.
6. Probar: `/contribuir` → enviar → `/admin/review` → aprobar → ver borrador en DB.
5. Fijar `NEXT_PUBLIC_SITE_URL` al dominio real antes de compartir.
6. Validar: Meta Sharing Debugger (1 property + 1 journal) + `/feed.xml` + `/sitemap.xml` en producción.

## Seguridad mínima

- `service_role` y `ADMIN_TOKEN` jamás salen del servidor (`lib/db.ts` y admin son server-only). La publishable key sí puede llegar al navegador.
- `POST /api/submissions` exige una sesión Supabase Auth y comprueba que el usuario esté vinculado al handle enviado mediante `verified_contributors.auth_user_id`.
- La columna y el índice de vínculo se crean con `supabase/03-contributor-auth.sql` si el proyecto ya ejecutó el esquema inicial.
- El E2E HTTP se activa solo con variables `E2E_*` de un proyecto de testing dedicado; `E2E_AUTH_COOKIE` representa la sesión de un colaborador invitado y nunca debe apuntar a producción.
- RLS sin policies + bucket escritura solo `service_role` (ver `04`).
- Solo JPEG ≤8MB, `rights_granted` obligatorio, allowlist estricta, limpieza de huérfanos en API.
- Free tier estimado: ~200 fotos ≈ 60MB, sobra para arranque.
