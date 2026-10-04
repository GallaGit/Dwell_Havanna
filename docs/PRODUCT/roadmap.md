# Dwell Havana roadmap

Estado actualizado: 2026-10-03

Este documento reúne el trabajo hecho, los pasos de activación y las fases siguientes. Las casillas marcadas reflejan el estado documentado en `docs/Idea/Fase-1-Cierre.md` y en `docs/Tech/`.

## Visión del producto

- [x] Definir Dwell Havana como una revista editorial digital sobre arquitectura, interiores, cultura y casas distintivas de La Habana.
- [x] Priorizar fotografía, narrativa, tipografía, espacio en blanco y composición editorial.
- [x] Evitar una experiencia de portal inmobiliario, una estética corporativa y la publicación automática sin revisión humana.
- [x] Usar la web como fuente canónica para compartir contenido con terceros.

## Trabajo completado

### Base del proyecto

- [x] Crear la aplicación con Next.js `16.3.8`, React `19.2.8`, TypeScript y Tailwind CSS v4.
- [x] Configurar App Router, TypeScript estricto, ESLint y alias `@/*`.
- [x] Crear el layout editorial con Fraunces e Inter.
- [x] Definir tokens visuales en `app/globals.css`.
- [x] Crear header, footer y componentes editoriales reutilizables.
- [x] Preparar el layout responsive para móvil y escritorio.

### Contenido y rutas

- [x] Crear la portada editorial en `/`.
- [x] Crear `/about`.
- [x] Crear el índice `/properties`.
- [x] Crear el detalle `/properties/[slug]`.
- [x] Crear el índice `/journal`.
- [x] Crear el detalle `/journal/[slug]`.
- [x] Incorporar 3 properties y 4 journal posts iniciales.
- [x] Configurar `generateStaticParams()` para properties y journal.
- [x] Configurar ISR con `revalidate = 3600`.
- [x] Configurar metadata, canonical, Open Graph y Twitter por slug.

### Supabase y contenido

- [x] Crear `supabase/01-schema.sql`.
- [x] Crear `supabase/02-seed.sql`.
- [x] Definir las tablas `properties`, `journal_posts`, `verified_contributors`, `submissions` y `syndications`.
- [x] Activar RLS en las tablas sin exponer lecturas públicas.
- [x] Crear el bucket `dwell-media` privado y `dwell-published` para la copia ya aprobada. La escritura sigue restringida al servidor.
- [x] Crear `lib/db.ts` para el cliente server-side.
- [x] Crear `lib/content.ts` para leer contenido publicado.
- [x] Mantener `lib/data.ts` como fallback estático.
- [x] Hacer que las páginas funcionen sin Supabase configurado.
- [x] Verificar la lectura con `service_role` y el aislamiento de la key pública.

### Ingesta y moderación

- [x] Crear `/contribuir`.
- [x] Crear `POST /api/submissions` con `multipart/form-data`.
- [x] Validar colaborador autorizado, caption, derechos, JPEG y límite de 4 MB.
- [x] Redimensionar en el navegador antes de enviar (lado largo 2560 px, JPEG ≤ 4 MB) sin recomprimir un JPEG que ya cabe.
- [x] Subir originales a Supabase Storage.
- [x] Limpiar archivos huérfanos cuando falla el insert.
- [x] Crear `/admin/review`.
- [x] Proteger el panel con `ADMIN_TOKEN` y cookie `dh_admin`.
- [x] Aprobar submissions y publicarlas en Journal después de una confirmación editorial.
- [x] Rechazar submissions sin publicarlas.
- [x] Mantener la revisión humana como requisito editorial.
- [x] Completar una prueba end-to-end y limpiar sus datos de prueba.

### Sindicación pull

- [x] Crear `/feed.xml` con RSS 2.0.
- [x] Crear `/sitemap.xml` dinámico.
- [x] Crear `/embed/[slug]` para terceros.
- [x] Incluir imágenes y URLs canónicas en la sindicación.
- [x] Verificar feed, sitemap y metadata durante la prueba end-to-end.

### Verificación de Fase 1

- [x] Ejecutar `npm run lint` con resultado correcto.
- [x] Ejecutar `npm run build` con resultado correcto.
- [x] Verificar las rutas de la build de Fase 1. La tabla vigente está en `docs/Tech/03-frontend-rutas-render.md`. La cifra 21 no corresponde a rutas extra.
- [x] Resolver el bloqueo histórico `403 unknown_contributor` con un servidor de desarrollo fresco.
- [x] Documentar el problema local de certificados TLS sin incorporarlo al código ni a la configuración de producción.

## Paso 1: cerrar la optimización local

Las optimizaciones de imagen ya están en `main` desde el PR #2 (`c100222`, `perf: optimize editorial images and add product roadmap`). No son cambios sin commitear.

- [x] Añadir formatos AVIF y WebP en `next.config.ts`.
- [x] Añadir `minimumCacheTTL` para imágenes optimizadas.
- [x] Definir `quality={70}` en imágenes editoriales.
- [x] Definir `sizes` responsive en las imágenes principales.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [ ] Revisar visualmente home, property detail y journal detail en móvil y escritorio. El contraste y el orden de encabezados se midieron con Lighthouse local (`docs/Tech/07-rendimiento.md`); falta la revisión humana de composición.

## Iteración: tests automatizados

- [x] Añadir el script `npm test` con el runner nativo `node:test`.
- [x] Cubrir normalización de handles.
- [x] Cubrir JPEG válido y firma binaria inválida.
- [x] Cubrir derechos obligatorios.
- [x] Cubrir el límite de 4 MB y el tope de 4,5 MB del cuerpo.
- [x] Añadir una prueba HTTP end-to-end opt-in para `/api/submissions`, con limpieza de datos y archivos temporales.
- [x] Proteger submissions con sesión Supabase Auth y vínculo `auth_user_id` en `verified_contributors`.
- [x] Añadir acceso por invitación en `/iniciar-sesion`; no existe registro público.
- [x] Configurar un proyecto Supabase de testing, sus keys publishable/service, una cuenta colaboradora invitada y `E2E_AUTH_COOKIE` para ejecutar el escenario autenticado del E2E.
- [x] Aplicar las migraciones de permisos editoriales `03` y `04` en testing.
- [x] Aplicar la migración de gestión de miembros editoriales `20260921000300` en testing.
- [x] Crear el primer miembro editorial `owner` en testing sin promover al usuario existente de E2E.
- [ ] Validar en navegador el flujo completo de aprobación, publicación y rechazo.

## Evolución de permisos editoriales

Esta evolución reemplaza el uso compartido de `ADMIN_TOKEN`. El 2026-09-25 testing tenía dos `owner` activos y producción tenía el esquema sin filas en `editorial_members`. Los dos proyectos están pausados desde el 2026-10-03. El código ya no acepta el token (DH-SEC-002). Falta borrar `ADMIN_TOKEN` y `ADMIN_TOKEN_TTL_SECONDS` en Vercel después de desplegar.

### Modelo decidido y base implementada

- [x] Mantener `verified_contributors` para las identidades que pueden enviar contenido.
- [x] Crear identidades editoriales individuales con Supabase Auth.
- [x] Crear una tabla de miembros editoriales con roles `owner` y `moderator`.
- [x] Permitir que solo la propietaria otorgue, retire o cambie permisos desde `/admin/review`.
- [x] Añadir un estado activo para revocar el acceso sin borrar el historial.
- [x] Registrar quién y cuándo ejecutó cada acción de moderación.
- [x] No usar `ADMIN_TOKEN` para moderadores. El token se retiró del código (DH-SEC-002).

### Roles y permisos

| Rol | Puede enviar | Puede revisar | Puede aprobar o rechazar | Puede invitar colaboradores | Puede gestionar permisos | Puede publicar |
|---|---:|---:|---:|---:|---:|---:|
| `contributor` | Sí | No | No | No | No | No |
| `moderator` | Opcional | Sí | Sí | No | No | Sí, al aprobar un envío de comunidad |
| `owner` | Opcional | Sí | Sí | Sí | Sí | Sí |

### Orden obligatorio de implementación

1. **Definir el modelo de permisos**
   - [x] Elegir los nombres finales de tablas, roles y acciones.
   - [x] Definir qué puede hacer cada rol.
   - [x] Confirmar que gestionar permisos queda reservado a `owner`. Aprobar publica el envío de comunidad, y `moderator` también puede aprobar.

2. **Crear el esquema de roles**
   - [x] Crear una migración para `editorial_members`.
   - [x] Añadir `role`, `active`, `display_name`, `created_at` y `updated_at`.
   - [x] Crear `moderation_events` para la auditoría.
   - [x] Mantener RLS activo y usar el cliente de servicio solo desde el servidor.

3. **Crear la autorización server-side**
   - [x] Crear una única función que obtenga el miembro editorial desde la sesión Supabase.
   - [x] Rechazar cuentas inexistentes o inactivas.
   - [x] Comprobar permisos en cada Server Action y Route Handler implementado.
   - [x] No decidir permisos con `user_metadata`.

4. **Migrar el acceso de la propietaria**
   - [x] Invitar la cuenta Supabase de la propietaria en el proyecto de testing.
   - [x] Vincularla con el rol `owner` en testing.
   - [x] Probar el acceso individual en testing: la cuenta abre `/admin/review` y ve la cola, las invitaciones y la gestión de miembros.
   - [x] El fallback `ADMIN_TOKEN` se retiró del código. El panel solo abre con un miembro activo.

5. **Añadir moderadores**
   - [x] Permitir que `owner` invite moderadores.
   - [x] Permitir que `owner` active, desactive o cambie el rol de un miembro.
   - [ ] Mostrar en el panel la identidad de la persona autenticada.
   - [x] Impedir que un moderador invite, desactive o eleve a otro moderador.

6. **Migrar la cola de moderación**
   - [x] Proteger `/admin/review` con Supabase Auth y el rol editorial. No hay token de emergencia.
   - [x] Permitir a `moderator` aprobar y rechazar submissions.
   - [x] Guardar un evento de auditoría para cada decisión.
   - [x] Rechazar dos decisiones simultáneas sobre el mismo envío mediante la condición `status='pending'`.

7. **Añadir pruebas y retirar el fallback**
   - [x] Cubrir `owner`, `moderator`, miembro inactivo y el rechazo de un objeto con forma de fallback en `tests/editorial-permissions.test.mjs`.
   - [ ] Probar en navegador la revocación de una cuenta que ya tenía sesión.
   - [ ] Probar en navegador la auditoría de aprobaciones y rechazos.
   - [x] Retirar `ADMIN_TOKEN` del código (DH-SEC-002). Borrar las variables en Vercel es un paso manual del despliegue.

### Correcciones y retiro solicitados por contribuidores

- [ ] Permitir que un colaborador vea sus propios envíos.
- [ ] Permitir editar y retirar envíos `pending` sin borrar el historial.
- [ ] Permitir corregir y reenviar envíos `rejected`.
- [ ] Permitir solicitar correcciones o retiro para contenido `approved` o publicado.
- [ ] Añadir una nota de moderación y el registro de la decisión editorial.
- [ ] Definir estados `change_requested`, `withdrawal_requested`, `withdrawn` y `unpublished`.
- [ ] Registrar ediciones, reenvíos, retiros, restauraciones y despublicaciones en `moderation_events`.
- [ ] Mantener el borrado físico como excepción administrativa o legal.

### Casos que deben quedar cubiertos

- Un colaborador normal crea un envío `pending`.
- Un moderador aprueba un envío y queda registrado como autor de la decisión.
- Un moderador rechaza un envío y queda registrado como autor de la decisión.
- Un moderador no puede invitar colaboradores.
- Un moderador no puede cambiar permisos.
- Un colaborador no puede abrir el panel editorial.
- Una cuenta desactivada pierde el acceso aunque conserve una sesión anterior.
- Un colaborador no puede enviar usando el handle de otra persona.

## Preparación de producción en el código

Hecho en el repositorio el 2026-09-25, en el PR #9. Esta lista es el código. El SQL de las bases se aplicó el mismo día y está en el Paso 2.

- [x] Corregir el open redirect de `/iniciar-sesion` (`lib/safe-redirect.ts`). Viene del PR #8.
- [x] Añadir `npm run build` a CI. Viene del PR #8.
- [x] Dejar las páginas públicas en estático o ISR de una hora, también con `SUPABASE_SERVICE_ROLE_KEY` definida. La portada no lee cookies.
- [x] Saltar `getUser()` en `proxy.ts` cuando la petición no trae cookie de Supabase Auth.
- [x] Quitar `.reveal` de la foto principal. Ajustar `sizes` y no duplicar la foto de arquitectura en la portada.
- [x] Servir OG, RSS y embed a través de `/_next/image` (1200px, calidad 70).
- [x] Subir el contraste de `--color-muted` a `#6f685e` (AA sobre paper y cream) y corregir el orden de encabezados en los índices.
- [x] Dejar un solo `id="contact"`, en `/about`.
- [x] Añadir `metadataBase`, Open Graph por defecto, `app/robots.ts`, manifiesto e iconos provisionales.
- [x] Centralizar fotos, párrafos y email de prueba en `lib/placeholders.ts`. El email real es `NEXT_PUBLIC_CONTACT_EMAIL`.
- [x] Documentar el SQL canónico en `scripts/apply-canonical-sql.sh` (dry-run por defecto).
- [x] Medir Lighthouse local contra `next start`. En móvil, rendimiento 93–98 y accesibilidad 100. Tabla en `docs/Tech/07-rendimiento.md`.
- [x] Hacer funcional el filtro de temas de `/journal` (`app/journal/JournalIndex.tsx`). Antes los chips no filtraban.

El PR #9 (`6f0e354`) ya está en `main` y sustituye al #8, cerrado sin fusionar. El PR #14 (`14b86c1`) también está en `main`.

## Auditoría del 2026-09-30

Los hallazgos prioritarios quedaron cerrados en el PR #14, ya en `main`:

- [x] DH-SEC-001. `dwell-media` privado, URL firmada en el panel, copia aprobada en `dwell-published` y borrado al rechazar.
- [x] DH-SEC-003. Reinvitar un handle ya vinculado no pisa `auth_user_id`.
- [x] DH-SEC-004, el tamaño. JPEG de hasta 4 MB y cuerpo de hasta 4,5 MB.
- [x] DH-SEC-005. El JPEG se guarda sin EXIF.
- [x] DH-SEC-006. Next.js `16.3.8`.
- [x] El navegador reduce PNG, WebP, HEIC (si lo decodifica) y las fotos grandes a un JPEG de lado largo ≤ 2560 px y de menos de 4 MB. Un JPEG que ya cumple eso se envía tal cual.

Cerrado en código, pendiente de aplicar en la base y en Vercel:

- [x] DH-SEC-002. El código ya no lee `ADMIN_TOKEN` ni escribe la cookie `dh_admin`. Tras el despliegue hay que borrar `ADMIN_TOKEN` y `ADMIN_TOKEN_TTL_SECONDS` en Vercel.
- [x] DH-SEC-004, el ritmo. `consume_rate_limit` en Postgres. Envíos, enlace mágico e invitaciones. Si la función no responde, no se envía ni se sube.
- [x] DH-SEC-007. `import "server-only"` en `lib/db.ts`. La lectura pública usa la clave publishable cuando la policy `published_read` devuelve filas. Hasta entonces repite el filtro `status = published` con `service_role` en un fetch cacheable (`revalidate: 3600`). El cliente `no-store` no sirve para el prerender.
- [x] DH-SEC-008. CSP en `proxy.ts` (sin nonce, para no apagar el ISR), HSTS y COOP en `next.config.ts`.
- [x] DH-SEC-009. `remotePatterns` toma el hostname de `NEXT_PUBLIC_SUPABASE_URL`. Picsum ya no está. Unsplash sigue por el seed.
- [x] DH-SEC-010. `/api/auth/magic-link` responde el mismo texto de bandeja, esté o no invitado el email.
- [x] DH-SEC-011. Cerrar sesión en `/contribuir` y `/admin/review`. Borra la sesión de Auth y, si queda, `dh_admin`.
- [x] DH-SEC-012, el código. `shouldCreateUser: false` está en el servidor. Falta desactivar el signup en el dashboard de Supabase.
- [x] DH-SEC-013, el SQL. Migración `20261003231500_rls_revoke_rate_limit.sql`. Falta aplicarla en la base.
- [x] DH-SEC-014. El ref no se rota. Al reactivar, sí se rota la service role. No copies el ref a un issue público. `SECURITY.md` lo dice.
- [x] DH-SEC-015. Un solo camino de aplicación: `scripts/apply-canonical-sql.sh`. El porqué de no meter el esquema base en `migrations/` está en `supabase/README.md`.
- [x] CI: `npm audit --omit=dev --audit-level=high`, Dependabot, `permissions: contents: read` y Actions por SHA.

Pendiente de operación, no de código:

- [ ] Reactivar producción y aplicar el bucket privado, el `REVOKE` / `FORCE RLS`, la policy de publicados y el límite de ritmo. El procedimiento está en el Paso 2.
- [ ] Borrar `ADMIN_TOKEN` y `ADMIN_TOKEN_TTL_SECONDS` en Vercel.
- [ ] Desactivar el signup en Authentication → Providers → Email.
- [ ] Rotar la service role al reactivar (DH-SEC-014).

## Paso 2: activar Supabase y producción

La web pública es `https://dwell-havanna.vercel.app`. `NEXT_PUBLIC_SITE_URL` ya está configurada así en Vercel. `dwellhavana.com` es el dominio siguiente, con correo por Resend, y todavía no está conectado. El registro del esquema al 2026-09-25 está en `docs/Tech/08-estado-supabase-2026-09-25.md`. El procedimiento de reactivación está en `docs/Tech/06-config-operacion.md`.

Producción (`sfujmwumtzuzwwhfmyxa`, Dwell_Havanna_DB) y testing (`ypeizxnafipvojpntsaw`) están pausados desde el 2026-10-03. Al reactivar producción no reapliques el SQL del 2026-09-25. Aplica `supabase/migrations/20261003150500_private_dwell_media.sql` y `supabase/migrations/20261003231500_rls_revoke_rate_limit.sql`, y después `scripts/migrate-dwell-media-objects.mjs`.

`scripts/apply-canonical-sql.sh` lista el orden de una base nueva. Con `--apply`, cada archivo va en una transacción. El ref `sfujmwumtzuzwwhfmyxa` queda bloqueado salvo `--allow-production`.

### Hecho el 2026-09-25, antes de la pausa

- [x] Proyecto `sfujmwumtzuzwwhfmyxa` (Dwell_Havanna_DB, organización `oxfilxdghpzkqyvtjkiy`, `ca-central-1`) activo aquel día. Pausado desde el 2026-10-03.
- [x] Aplicar el esquema editorial. El orden usado fue el del esquema anterior a `03`: primero `03-contributor-auth.sql`, después `01-schema.sql`. Versiones y archivos en `supabase/prod-applied/2026-09-25/`.
- [x] Conservar el seed del 2026-09-15: 3 `properties` y 4 `journal_posts`, publicadas.
- [x] Borrar los 2 colaboradores de prueba. `verified_contributors` quedó en 0 filas.
- [x] Aquel día el bucket `dwell-media` quedó público, con la policy `dwell-media public read`, y 0 objetos. Ese no es el estado deseado. El PR #14 lo sustituye.
- [x] Quitar `EXECUTE` de `anon`, `authenticated` y `public` sobre `public.rls_auto_enable()`.

Aquel día: siete tablas, RLS activo y 0 policies. Cero usuarios Auth. Cero filas en `editorial_members`.

### Reactivar producción

- [ ] Reactivar `sfujmwumtzuzwwhfmyxa`. Testing (`ypeizxnafipvojpntsaw`) también está pausado.
- [ ] Ejecutar `supabase/migrations/20261003150500_private_dwell_media.sql` y después `supabase/migrations/20261003231500_rls_revoke_rate_limit.sql`. La primera deja `dwell-media` privado y crea `dwell-published`. La segunda revoca GRANT, fuerza RLS, abre la lectura de publicados y crea el límite de ritmo. No reapliques `01-schema.sql`.
- [ ] Migrar los objetos con `scripts/migrate-dwell-media-objects.mjs` (primero sin `--apply`). Las aprobadas pasan a `dwell-published/<uuid>.jpg`; las pendientes pierden el handle de la ruta; las rechazadas se borran.
- [ ] Invitar la cuenta de Ociel en Supabase Auth. Después, insertar su fila `owner` en `editorial_members`. La columna es clave foránea a `auth.users`.
- [ ] Activar en el dashboard de Auth la protección de contraseñas filtradas.
- [ ] Desactivar el signup en Authentication → Providers → Email (DH-SEC-012). El código ya envía `shouldCreateUser: false`, y eso no basta si el proyecto acepta altas directas.
- [ ] Rotar la service role al reactivar (DH-SEC-014). El ref del proyecto puede seguir en el repo. No lo copies a un issue público. No hace falta rotarlo por estar escrito.

### Hosting, dominio y medición

- [x] Crear el proyecto en Vercel y publicar `https://dwell-havanna.vercel.app`.
- [x] Configurar `NEXT_PUBLIC_SITE_URL` con esa URL.
- [ ] Renovar `dwellhavana.com` antes del 2026-10-06. El correo irá por Resend cuando el dominio esté conectado. Todavía no lo está.
- [ ] Apuntar el DNS del apex y de `www` al hosting cuando se use ese dominio.
- [ ] En Supabase Auth, fijar la Site URL a la URL pública vigente y la allowlist de `/auth/callback`. Hoy es `https://dwell-havanna.vercel.app`. Cuando entre `dwellhavana.com`, cambia las dos.
- [ ] Configurar las plantillas Invite user y Magic Link con `token_hash` y `type`, como en `docs/Tech/06-config-operacion.md`.
- [ ] Confirmar en Vercel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SERVICE_ROLE_KEY` contra el proyecto reactivado. Borrar `ADMIN_TOKEN` y `ADMIN_TOKEN_TTL_SECONDS`. `NEXT_PUBLIC_SUPABASE_URL` tiene que estar en el build: el hostname de `images.remotePatterns` sale de ahí.
- [ ] Confirmar que ninguna variable secreta se expone al navegador.
- [ ] Ejecutar Lighthouse contra `https://dwell-havanna.vercel.app`. Objetivo: Performance ≥ 90 y Accesibilidad ≥ 95 en móvil (`docs/Tech/07-rendimiento.md`).
- [ ] Sustituir imágenes, textos e iconos provisionales (`docs/PRODUCT/contenido-placeholder.md`).
- [ ] Invitar colaboradores mediante `/admin/review` y comprobar el vínculo Auth ↔ `verified_contributors`.

La plantilla de los emails de invitación y de magic link está en `docs/Tech/06-config-operacion.md`.

### Orden SQL de una base nueva

No uses esta lista para reactivar producción. Ahí van las dos migraciones del Paso 2, no el esquema entero.

1. `supabase/01-schema.sql`
2. `supabase/03-contributor-auth.sql`
3. `supabase/04-editorial-permissions.sql`
4. `supabase/migrations/20260921000300_editorial_member_management.sql`
5. `supabase/migrations/20261003150500_private_dwell_media.sql`
6. `supabase/migrations/20261003231500_rls_revoke_rate_limit.sql`
7. `supabase/02-seed.sql`, solo si se quiere el contenido de ejemplo
8. Alta del primer `owner` en `editorial_members` con su `auth_user_id`

Si `verified_contributors` ya existe sin `auth_user_id`, `03-contributor-auth.sql` va antes de `01-schema.sql`. Producción se migró así el 2026-09-25. El detalle está en `docs/Tech/06-config-operacion.md`.

## Paso 3: repetir el E2E en producción

- [ ] Abrir `/contribuir` desde móvil.
- [ ] Enviar una foto de un colaborador autorizado.
- [ ] Confirmar que una cuenta no autorizada recibe `403`.
- [ ] Confirmar que un envío sin derechos recibe `422`.
- [ ] Revisar el envío en `/admin/review`.
- [ ] Aprobarlo después de la confirmación del panel.
- [ ] Confirmar que `journal_posts.status` queda en `published` y que el post aparece en `/journal`.
- [ ] Confirmar `/feed.xml` en producción.
- [ ] Confirmar `/sitemap.xml` en producción.
- [ ] Validar un slug de property con Meta Sharing Debugger.
- [ ] Validar un slug de journal con Meta Sharing Debugger.
- [ ] Revisar la carga de imágenes desde Supabase Storage.

### Pruebas obligatorias antes de lanzar

- [ ] **Prueba de subida de fotos en `/contribuir` (obligatoria).** Hay que hacerla con producción reactivada. El hallazgo del 26-09-2026 sigue abierto en un caso: el post `community-33f1c1ee` («5 esquinas») se veía mal porque el archivo era de 399×501 px y 44 KB. La portada (`app/journal/[slug]/page.tsx`) sigue en `aspect-[16/9]` con `object-cover`, y Next sigue sirviendo esa foto con `quality={70}`.

  Hecho en el PR #14, ya en `main`:

  - [x] El navegador deja la foto en JPEG, lado largo ≤ 2560 px y menos de 4 MB, antes del POST. Un JPEG que ya cumple eso no se recomprime. PNG, WebP y HEIC entran si el navegador los decodifica. Si no puede leer el archivo, no hay POST.
  - [x] El servidor sigue aceptando solo JPEG, sin EXIF, de hasta 4 MB. Un cuerpo de más de 4,5 MB responde `413 body_too_large`.
  - [x] Ya no hay un tope de 8 MB ni un mensaje que diga que solo se acepta JPEG sin conversión.

  Casos que siguen pendientes. En cada uno, anota el resultado y el texto que ve quien envía:

  1. JPEG de buena calidad (lado mayor entre 1600 y 2560 px, menos de 4 MB). Se envía tal cual. Tiene que verse nítido en la portada del post, en la home y en `/journal`.
  2. JPEG grande (más de 4 MB o lado mayor por encima de 2560 px), y un PNG o WebP grande. El navegador los convierte. El post publicado tiene que verse nítido.
  3. HEIC de iPhone. Si el navegador lo decodifica, el resultado es el del caso 2. Si no, el formulario avisa y no llama a la API.
  4. JPEG pequeño (menos de 1000 px), como el de «5 esquinas». Sigue aceptándose sin aviso. Anota cómo se ve ampliado en la portada 16:9.
  5. Foto vertical de alta resolución. Anota el recorte de `object-cover` en 16:9.
  6. Un cuerpo por encima de 4,5 MB, si alguien evita el formulario, responde `413`. Una foto que el navegador no logra dejar bajo 4 MB responde con el aviso del formulario y no se envía.

  Sigue sin implementar, y se decide después de esta prueba:

  - Avisar si el lado mayor queda por debajo de unos 1600 px.
  - Mostrar la portada con la proporción de la foto, en vez de forzar 16:9.
  - Servir la portada del post y el destacado de la home con una calidad por encima de 70. Hoy `next.config.ts` solo declara `qualities: [70]`.

## Paso 4: completar el contenido editorial

- [ ] Reemplazar los textos, imágenes y datos de ejemplo por contenido real.
- [ ] Confirmar el email y los datos de contacto reales.
- [ ] Revisar títulos, excerpts, categorías y fechas.
- [ ] Revisar textos alternativos de todas las imágenes.
- [ ] Revisar los contenidos en móvil.
- [ ] Confirmar que Properties mantiene una presentación editorial y no una tabla de inventario.

## Paso 5: crear el CMS editorial mínimo

- [ ] Crear una vista autenticada para listar `draft`, `review` y `published`.
- [ ] Permitir editar properties.
- [ ] Permitir editar journal posts.
- [ ] Permitir editar título, excerpt, cuerpo, imagen y metadata.
- [ ] Permitir cambiar el estado editorial.
- [ ] Permitir publicar solo después de una acción humana explícita.
- [ ] Añadir validación server-side a cada acción editorial.
- [ ] Registrar quién y cuándo cambió el estado.
- [ ] Añadir una acción clara para revalidar el contenido publicado.

## Paso 6: preparar Meta

Acciones de la dueña de las cuentas, antes de implementar la API.

- [ ] Convertir Instagram en cuenta Business o Creator.
- [ ] Crear o confirmar la Facebook Page.
- [ ] Vincular Instagram y Facebook Page.
- [ ] Confirmar que el vínculo aparece como activo.
- [ ] Activar 2FA en la cuenta administradora.
- [ ] Completar Page Publishing Authorization si Meta la solicita.
- [ ] Crear la aplicación en Meta Developers.
- [ ] Añadir Instagram Graph API.
- [ ] Añadir Facebook Login for Business.
- [ ] Solicitar los permisos requeridos.
- [ ] Completar App Review y Advanced Access.
- [ ] Crear y guardar un token de larga duración en secrets.
- [ ] Confirmar que Meta puede descargar la URL pública de `dwell-published`. Las pendientes no tienen URL pública.

## Paso 7: Fase 2, auto-crossposting

- [ ] Crear `POST /api/syndicate`.
- [ ] Validar que el contenido está publicado antes de enviarlo.
- [ ] Crear una cola de publicaciones.
- [ ] Añadir reintentos controlados.
- [ ] Crear preview de caption para Facebook.
- [ ] Crear preview de caption para Instagram.
- [ ] Permitir editar captions antes de publicar.
- [ ] Publicar en Facebook Page.
- [ ] Crear el container de Instagram.
- [ ] Esperar el estado `FINISHED` del container.
- [ ] Publicar en Instagram.
- [ ] Guardar `external_id`, URL, estado y error en `syndications`.
- [ ] Mostrar el historial de publicaciones en el panel editorial.
- [ ] Probar expiración de tokens y errores de Meta.

## Paso 8: Fase 3, ingesta desde redes

- [ ] Diseñar el contrato de los webhooks de Meta.
- [ ] Crear `GET` y `POST /api/webhooks/meta`.
- [ ] Verificar `hub.challenge`.
- [ ] Validar eventos entrantes.
- [ ] Aplicar la allowlist de colaboradores.
- [ ] Deduplicar por `external_id`.
- [ ] Convertir eventos válidos en submissions pendientes.
- [ ] Crear polling como fallback si los webhooks fallan.
- [ ] Mantener la revisión humana antes de cualquier publicación.

## Controles vigentes

Controles que el código y el esquema ya aplican. La evidencia está en el repositorio. Lo que sigue abierto queda sin marcar.

- [x] RLS activo. `supabase/01-schema.sql` activa RLS en `properties`, `journal_posts`, `verified_contributors`, `submissions` y `syndications`. `supabase/04-editorial-permissions.sql` lo activa en `editorial_members` y `moderation_events`. En la prueba del 2026-09-15 (`docs/Idea/Fase-1-Cierre.md` §8) la key pública recibió `[]` en contributors y properties. En testing, la clave publishable no lee `editorial_members`, `moderation_events` ni `verified_contributors`.
- [x] Validación de derechos de imagen. `POST /api/submissions` exige `rights` y guarda `rights_granted`. `tests/submissions-validation.test.mjs` cubre el rechazo `rights_required`.
- [x] Lista de colaboradores verificados. El envío exige sesión y un `verified_contributors.auth_user_id` vinculado al handle. Un handle ajeno o desconocido responde `403 unknown_contributor` (`docs/Idea/Fase-1-Cierre.md` §2).
- [x] `SUPABASE_SERVICE_ROLE_KEY` no llega al navegador. Solo la leen módulos de servidor (`lib/db.ts`). No usa el prefijo `NEXT_PUBLIC_`.
- [x] No hay `ADMIN_TOKEN` en el código. El acceso editorial es una fila activa de `editorial_members`. El cierre de sesión borra una cookie `dh_admin` vieja si todavía está en el navegador.
- [x] No hay publicación automática. Aprobar en `/admin/review` pide confirmación y solo entonces inserta `journal_posts` con `status='published'`.
- [x] La web es la URL canónica. `lib/site.ts` expone `siteUrl` y `canonicalFor`.
- [ ] Evitar URLs firmadas que Meta no pueda leer cuando exista la publicación en redes (Paso 7).

## Estado de validación local y de testing

- `npm run lint`, `npm test` y `npm run build` pasan en la revisión del PR #14. La build no necesita secretos reales de Supabase. Con URL y service role de ejemplo, `/` sigue en ISR de una hora.
- `npm test` pasa 53 pruebas y omite 1 E2E HTTP porque no hay variables `E2E_*`. El archivo `tests/security-controls.test.mjs` cubre el límite de ritmo, el mensaje único del enlace mágico, el cierre de sesión y el fallback cacheable de la lectura pública.
- La tabla de rutas vigente está en `docs/Tech/03-frontend-rutas-render.md`. La cifra 19 es anterior a iconos, `robots.txt`, manifiesto y los slugs prerenderizados de `/embed`.
- Lighthouse local (móvil y escritorio, `next start`) está en `docs/Tech/07-rendimiento.md`.
- El E2E, cuando se configura, valida autenticación requerida, derechos obligatorios, colaborador desconocido, submission válida, persistencia y limpieza.
- RLS no devuelve filas a la clave publishable para `editorial_members`, `moderation_events` ni `verified_contributors`.
- El 2026-09-25, testing tenía aplicadas `20260921000100`, `20260921000200`, `20260921000300` y `canonical_01_schema` (`20260925174404`). Había dos `owner` activos, 3 usuarios Auth, 2 colaboradores vinculados, 2 submissions, 3 `moderation_events` y un post de comunidad en `review`. El recuento está en `docs/Tech/08-estado-supabase-2026-09-25.md`. El proyecto está pausado desde el 2026-10-03.
- El 2026-09-25, producción tenía el esquema editorial, el seed (3 properties y 4 posts) y cero colaboradores, cero miembros editoriales y cero usuarios Auth. Está pausada desde el 2026-10-03. Falta aplicar el bucket privado.
- Falta la prueba de navegador del flujo completo de aprobación, publicación y rechazo.

Para otra cuenta editorial, invítala desde el panel o inserta su UUID:

```sql
insert into editorial_members (auth_user_id, role, display_name)
values ('<auth-user-uuid>', 'owner', '<nombre editorial>');
```

Después valida `/iniciar-sesion?next=/admin/review`, la cola de moderación y los registros de `moderation_events` con esa cuenta.

## Orden de ejecución

1. Cerrar y verificar la optimización local.
2. Activar Supabase y desplegar la Fase 1.
3. Repetir el flujo end-to-end en producción.
4. Completar el contenido editorial real.
5. Crear el CMS editorial mínimo.
6. Preparar las cuentas y permisos de Meta.
7. Implementar la Fase 2 de auto-crossposting.
8. Implementar la Fase 3 de ingesta desde redes.

## Referencias

- `docs/Idea/Fase-1-Cierre.md`
- `docs/Idea/Plan-Crossposting.md`
- `docs/Dwell-Havana_Design-Direction/Design-Direction.md`
- `docs/Tech/README.md`
- `docs/Tech/01-stack.md`
- `docs/Tech/02-estructura-carpetas.md`
- `docs/Tech/03-frontend-rutas-render.md`
- `docs/Tech/04-backend-datos-supabase.md`
- `docs/PRODUCT/05-flujos-editoriales.md`
- `docs/Tech/06-config-operacion.md`
- `docs/Tech/07-rendimiento.md`
- `docs/PRODUCT/contenido-placeholder.md`
- `docs/PRODUCT/07-guia-acceso-colaboradores.md`
