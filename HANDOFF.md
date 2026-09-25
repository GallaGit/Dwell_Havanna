# Handoff — 25 de septiembre de 2026

## Rama

El trabajo de producción está en `cursor/prod-ready-a1d1`. Sustituye al PR #8 (`cursor/prod-paso-2-prep-a275`). No se ha hecho merge. `main` sigue en `62d4225` (`merge: editorial permissions model`).

## Siguiente

Paso 2 de `docs/PRODUCT/roadmap.md`: la dueña activa producción. El código ya está preparado para Vercel. No hay proyecto de hosting ni proyecto Supabase de producción operativo.

Bloqueos de ese paso:

- Renovar `dwellhavana.com` antes del 2026-10-06 y configurar el DNS del apex y de `www`.
- Restaurar o recrear el proyecto Supabase de producción (`Dwell_Havanna_DB`, `sfujmwumtzuzwwhfmyxa`). El 2026-09-15 tenía esquema, seed, colaboradores y el bucket `dwell-media` (`docs/Idea/Fase-1-Cierre.md` §8). Ahora no resuelve. El orden SQL está en `scripts/apply-canonical-sql.sh` (dry-run por defecto; el ref de producción exige `--allow-production`).
- Crear el proyecto en Vercel, configurar las variables de `.env.example`, la Site URL, la allowlist `https://dwellhavana.com/auth/callback` y las plantillas de email con `token_hash`.
- Desplegar, medir Lighthouse en el dominio y sustituir el contenido PLACEHOLDER (`docs/PRODUCT/contenido-placeholder.md`).

## Qué quedó en código

- Las páginas públicas se prerenderizan (estáticas o ISR de una hora), también si existe `SUPABASE_SERVICE_ROLE_KEY`. La portada no llama a `cookies()`.
- `proxy.ts` no consulta Supabase Auth si la petición no trae cookie `sb-*-auth-token`. El login y el área editorial no cambian.
- `--color-muted` es `#6f685e` (AA sobre `#faf7f2` y `#f3eee6`). Los índices usan `h2` en las tarjetas. `id="contact"` solo está en `/about`.
- Metadata: `metadataBase`, Open Graph por defecto, `app/robots.ts`, manifiesto e iconos provisionales.
- Fotos, párrafos de prueba y el email `hola@dwellhavana.example` viven en `lib/placeholders.ts`. El email real es `NEXT_PUBLIC_CONTACT_EMAIL`.
- OG, RSS y embed piden la imagen a `/_next/image` (1200px, calidad 70).
- `lib/safe-redirect.ts` solo acepta un path relativo del mismo origen. Lo usan `/auth/callback` y `/iniciar-sesion`.
- CI ejecuta `npm run lint`, `npm test` y `npm run build`.
- `ADMIN_TOKEN` sigue como fallback temporal.

## Verificación de esta sesión

- `npm run lint`
- `npm test`: 17 pruebas pasan y 1 E2E HTTP se omite porque no hay variables `E2E_*`
- `npm run build`: el contenido público queda en ISR de 1 h. Siguen dinámicas `/admin/review`, `/api/submissions` y `/auth/callback`
- Lighthouse local contra `next start`: `docs/Tech/07-rendimiento.md`

No se tocó ningún proyecto Supabase, no se ejecutaron migraciones remotas y no se desplegó.

No commitear `.env.local`, tokens de Supabase, contraseñas, service keys ni cookies de E2E.
