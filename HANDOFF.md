# Handoff — 25 de septiembre de 2026

## Rama

`main`, antes de este PR, está en `62d4225` (`merge: editorial permissions model`), después del PR #7 y de tres commits de docs (`aa1992c`, `a96ebc9`, `62d4225`). No había rama de feature activa. El PR #7 (permisos editoriales) ya está en `main`.

## Siguiente

Paso 2 de `docs/PRODUCT/roadmap.md`: activar producción. Es trabajo de la dueña, fuera del repositorio. No hay hosting configurado.

Bloqueos de ese paso:

- El proyecto Supabase de producción (`Dwell_Havanna_DB`, `sfujmwumtzuzwwhfmyxa`) no resuelve. El 2026-09-15 tenía esquema, seed, colaboradores y el bucket `dwell-media` (`docs/Idea/Fase-1-Cierre.md` §8). Probable pausa o borrado. Hay que restaurarlo y re-verificar esas piezas. No aplicar SQL ni migraciones hasta entonces.
- El dominio `dwellhavana.com` hay que renovarlo antes del 2026-10-06. Falta el DNS del apex y de `www`.
- Falta elegir hosting (Vercel recomendado), las variables de entorno y la Site URL más la allowlist `https://<dominio>/auth/callback`.

## Qué quedó en código

- `lib/safe-redirect.ts` solo acepta un path relativo del mismo origen. Lo usan `/auth/callback` y `/iniciar-sesion`.
- `/auth/callback` sigue aceptando `?code=` (PKCE). También acepta `token_hash` + `type` vía `verifyOtp`. La plantilla de email está en `docs/Tech/06-config-operacion.md`.
- CI ejecuta `npm run lint`, `npm test` y `npm run build`. El build no necesita secretos.
- Aprobar en `/admin/review`, tras confirmación, inserta `journal_posts.status='published'`.
- `ADMIN_TOKEN` sigue como fallback temporal.

## Verificación de esta sesión

- `npm run lint`
- `npm test`: 13 pruebas pasan y 1 E2E HTTP se omite porque no hay variables `E2E_*`
- `npm run build`: 19 paths de la app

No se tocó ningún proyecto Supabase, no se ejecutaron migraciones y no se desplegó.

No commitear `.env.local`, tokens de Supabase, contraseñas, service keys ni cookies de E2E.
