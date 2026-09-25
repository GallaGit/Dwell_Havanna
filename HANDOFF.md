# Handoff — 25 de septiembre de 2026

La documentación canónica está en `docs/`. Este archivo solo señala el estado al cierre del día.

## Código

`main` está en `6f0e354`, el merge del PR #9. Ese PR sustituye al #8, cerrado sin fusionar. La preparación de código (ISR, redirects, CI, contraste) ya está en `main`.

## Supabase

Producción `sfujmwumtzuzwwhfmyxa` (Dwell_Havanna_DB) está activa. El 2026-09-25, 20:25–20:26 CEST, se aplicó el esquema editorial. Quedan el seed (3 properties y 4 journal posts), cero colaboradores y cero miembros editoriales. Testing `ypeizxnafipvojpntsaw` tiene dos `owner` activos.

El registro, el orden SQL que funciona y la deuda de migraciones están en `docs/Tech/08-estado-supabase-2026-09-25.md`. El procedimiento operativo está en `docs/Tech/06-config-operacion.md`.

## Lanzamiento, a cargo de Ociel

- Invitar su cuenta en Auth y después insertar la fila `owner`.
- Activar la protección de contraseñas filtradas en el dashboard de Auth.
- Confirmar la URL de Vercel y las variables de entorno. El proyecto está subido; el despliegue no está verificado.
- Renovar `dwellhavana.com` antes del 2026-10-06 y apuntar el DNS.
- Sustituir las imágenes y los textos de `lib/placeholders.ts`. Eso bloquea el lanzamiento.

La lista completa es el Paso 2 de `docs/PRODUCT/roadmap.md`.

Lighthouse local contra `next start`, en móvil: rendimiento 93–98 y accesibilidad 100 (`docs/Tech/07-rendimiento.md`).

No commitear `.env.local`, tokens de Supabase, contraseñas, service keys ni cookies de E2E.
