# Handoff — 3 de octubre de 2026

La documentación canónica está en `docs/`. Este archivo solo señala el estado al cierre del día.

## Código

`main` incluye el PR #9 (`6f0e354`) y el PR #14 (`14b86c1`). El #14 deja `dwell-media` privado, publica la copia aprobada en `dwell-published`, quita el EXIF, corta la foto en 4 MB y reduce en el navegador. Next.js está en `16.3.8`.

## Supabase

Producción `sfujmwumtzuzwwhfmyxa` (Dwell_Havanna_DB) y testing `ypeizxnafipvojpntsaw` están pausados desde el 2026-10-03. El 2026-09-25 producción tenía el esquema editorial, el seed y cero miembros. Testing tenía dos `owner` activos. Esa lectura está en `docs/Tech/08-estado-supabase-2026-09-25.md`.

Al reactivar producción se aplica solo `supabase/migrations/20261003150500_private_dwell_media.sql` y `scripts/migrate-dwell-media-objects.mjs`. El procedimiento está en `docs/Tech/06-config-operacion.md`.

## Web y acceso

La web pública es `https://dwell-havanna.vercel.app`. `NEXT_PUBLIC_SITE_URL` ya está así en Vercel. `dwellhavana.com` y el correo por Resend todavía no están conectados. `ADMIN_TOKEN` sigue como acceso de emergencia (DH-SEC-002 pendiente) con `ADMIN_TOKEN_TTL_SECONDS=3600`.

## Lanzamiento, a cargo de Ociel

- Reactivar producción y aplicar el bucket privado.
- Invitar su cuenta en Auth y después insertar la fila `owner`.
- Activar la protección de contraseñas filtradas en el dashboard de Auth.
- Renovar `dwellhavana.com` antes del 2026-10-06. El DNS espera a que el dominio se conecte.
- Sustituir las imágenes y los textos de `lib/placeholders.ts`. Eso bloquea el lanzamiento.

La lista completa es el Paso 2 de `docs/PRODUCT/roadmap.md`. Los hallazgos prioritarios de la auditoría del 2026-09-30 están cerrados en el #14. Quedan DH-SEC-002, el rate limit, los hallazgos bajos y la reactivación.

Lighthouse local contra `next start`, en móvil: rendimiento 93–98 y accesibilidad 100 (`docs/Tech/07-rendimiento.md`).

No commitear `.env.local`, tokens de Supabase, contraseñas, service keys ni cookies de E2E.
