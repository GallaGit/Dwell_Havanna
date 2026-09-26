# Dwell Havana roadmap

Estado actualizado: 2026-09-25

Este documento reúne el trabajo hecho, los pasos de activación y las fases siguientes. Las casillas marcadas reflejan el estado documentado en `docs/Idea/Fase-1-Cierre.md` y en `docs/Tech/`.

## Visión del producto

- [x] Definir Dwell Havana como una revista editorial digital sobre arquitectura, interiores, cultura y casas distintivas de La Habana.
- [x] Priorizar fotografía, narrativa, tipografía, espacio en blanco y composición editorial.
- [x] Evitar una experiencia de portal inmobiliario, una estética corporativa y la publicación automática sin revisión humana.
- [x] Usar la web como fuente canónica para compartir contenido con terceros.

## Trabajo completado

### Base del proyecto

- [x] Crear la aplicación con Next.js `16.3.5`, React `19.2.8`, TypeScript y Tailwind CSS v4.
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
- [x] Crear el bucket `dwell-media` con lectura pública y escritura restringida al servidor.
- [x] Crear `lib/db.ts` para el cliente server-side.
- [x] Crear `lib/content.ts` para leer contenido publicado.
- [x] Mantener `lib/data.ts` como fallback estático.
- [x] Hacer que las páginas funcionen sin Supabase configurado.
- [x] Verificar la lectura con `service_role` y el aislamiento de la key pública.

### Ingesta y moderación

- [x] Crear `/contribuir`.
- [x] Crear `POST /api/submissions` con `multipart/form-data`.
- [x] Validar colaborador autorizado, caption, derechos, JPEG y límite de 8 MB.
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
- [x] Cubrir el límite de 8 MB.
- [x] Añadir una prueba HTTP end-to-end opt-in para `/api/submissions`, con limpieza de datos y archivos temporales.
- [x] Proteger submissions con sesión Supabase Auth y vínculo `auth_user_id` en `verified_contributors`.
- [x] Añadir acceso por invitación en `/iniciar-sesion`; no existe registro público.
- [x] Configurar un proyecto Supabase de testing, sus keys publishable/service, una cuenta colaboradora invitada y `E2E_AUTH_COOKIE` para ejecutar el escenario autenticado del E2E.
- [x] Aplicar las migraciones de permisos editoriales `03` y `04` en testing.
- [x] Aplicar la migración de gestión de miembros editoriales `20260921000300` en testing.
- [x] Crear el primer miembro editorial `owner` en testing sin promover al usuario existente de E2E.
- [ ] Validar en navegador el flujo completo de aprobación, publicación y rechazo.

## Evolución de permisos editoriales

Esta evolución reemplaza el uso compartido de `ADMIN_TOKEN`. En testing ya hay un `owner` activo. `ADMIN_TOKEN` queda como fallback temporal hasta verificar ese acceso individual en producción.

### Modelo decidido y base implementada

- [x] Mantener `verified_contributors` para las identidades que pueden enviar contenido.
- [x] Crear identidades editoriales individuales con Supabase Auth.
- [x] Crear una tabla de miembros editoriales con roles `owner` y `moderator`.
- [x] Permitir que solo la propietaria otorgue, retire o cambie permisos desde `/admin/review`.
- [x] Añadir un estado activo para revocar el acceso sin borrar el historial.
- [x] Registrar quién y cuándo ejecutó cada acción de moderación.
- [x] No usar `ADMIN_TOKEN` para moderadores. El token solo queda como fallback temporal.

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
   - [x] Mantener `ADMIN_TOKEN` solo como fallback temporal.

5. **Añadir moderadores**
   - [x] Permitir que `owner` invite moderadores.
   - [x] Permitir que `owner` active, desactive o cambie el rol de un miembro.
   - [ ] Mostrar en el panel la identidad de la persona autenticada.
   - [x] Impedir que un moderador invite, desactive o eleve a otro moderador.

6. **Migrar la cola de moderación**
   - [x] Proteger `/admin/review` con Supabase Auth y el rol editorial, manteniendo el fallback temporal.
   - [x] Permitir a `moderator` aprobar y rechazar submissions.
   - [x] Guardar un evento de auditoría para cada decisión.
   - [x] Rechazar dos decisiones simultáneas sobre el mismo envío mediante la condición `status='pending'`.

7. **Añadir pruebas y retirar el fallback**
   - [x] Cubrir `owner`, `moderator`, miembro inactivo y el fallback temporal en `tests/editorial-permissions.test.mjs`.
   - [ ] Probar en navegador la revocación de una cuenta que ya tenía sesión.
   - [ ] Probar en navegador la auditoría de aprobaciones y rechazos.
   - [ ] Retirar `ADMIN_TOKEN` cuando el acceso `owner` individual esté verificado en producción.

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

Hecho en el repositorio el 2026-09-25. No despliega ni toca Supabase.

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
- [x] Medir Lighthouse local contra `next start`. Resultados en `docs/Tech/07-rendimiento.md`.
- [x] Hacer funcional el filtro de temas de `/journal` (`app/journal/JournalIndex.tsx`). Antes los chips no filtraban.

## Paso 2: activar Supabase y producción

Requiere credenciales y acciones de la dueña, fuera del repositorio. El código está preparado para Vercel. No hay proyecto de hosting creado.

Este paso activa producción. Las migraciones editoriales ya están en el repositorio y en testing. En producción se aplican con el orden SQL de abajo, antes de retirar `ADMIN_TOKEN`. El script `scripts/apply-canonical-sql.sh` lista ese orden y, con `--apply`, lo ejecuta si hay `DATABASE_URL` y `psql`. El ref `sfujmwumtzuzwwhfmyxa` queda bloqueado salvo `--allow-production`.

El 2026-09-15 el proyecto de producción (`sfujmwumtzuzwwhfmyxa`, `docs/Idea/Fase-1-Cierre.md` §8) ya tenía `supabase/01-schema.sql`, `supabase/02-seed.sql`, colaboradores en `verified_contributors` y el bucket `dwell-media`. Ese proyecto ahora no resuelve (probable pausa o borrado). Esas cuatro piezas quedan **a re-verificar**, no como hechas.

### Hosting, dominio y variables

- [ ] Crear el proyecto en Vercel (el hosting previsto) y conectar este repositorio.
- [ ] Renovar el dominio `dwellhavana.com` antes del 2026-10-06.
- [ ] Apuntar el DNS del apex y de `www` al hosting.
- [ ] Restaurar o recrear el proyecto Supabase de producción y aplicar las migraciones en el orden de abajo.
- [ ] En Supabase Auth, fijar la Site URL `https://dwellhavana.com` y la allowlist `https://dwellhavana.com/auth/callback`. Si el sitio también responde en `www`, permitir ese host.
- [ ] Configurar las plantillas Invite user y Magic Link con `token_hash` y `type`, como en `docs/Tech/06-config-operacion.md`.
- [ ] Configurar en Vercel `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_TOKEN` y, cuando exista el buzón, `NEXT_PUBLIC_CONTACT_EMAIL`.
- [ ] Desplegar la aplicación.
- [ ] Confirmar que ninguna variable secreta se expone al navegador.
- [ ] Ejecutar Lighthouse contra el dominio de producción. Objetivo: Performance ≥ 90 y Accesibilidad ≥ 95 en móvil (`docs/Tech/07-rendimiento.md`).
- [ ] Sustituir imágenes, textos e iconos provisionales (`docs/PRODUCT/contenido-placeholder.md`).

La plantilla de los emails de invitación y de magic link está en `docs/Tech/06-config-operacion.md`.

### Orden SQL canónico

Aplicar en el SQL Editor, en este orden. Los nombres son los archivos del repositorio. El mismo orden está en `docs/Tech/06-config-operacion.md` y en `docs/Idea/Fase-1-Cierre.md` §6.

1. `supabase/01-schema.sql`
2. `supabase/03-contributor-auth.sql`
3. `supabase/04-editorial-permissions.sql`
4. `supabase/migrations/20260921000300_editorial_member_management.sql`
5. `supabase/02-seed.sql`, solo si se quiere el contenido de ejemplo
6. Alta del primer `owner` en `editorial_members` con su `auth_user_id`

- [ ] Confirmar el proyecto Supabase de producción. A re-verificar: el proyecto del 2026-09-15 no resuelve.
- [ ] Ejecutar `supabase/01-schema.sql`. A re-verificar: el 2026-09-15 ya estaba aplicado.
- [ ] Ejecutar `supabase/03-contributor-auth.sql`.
- [ ] Ejecutar `supabase/04-editorial-permissions.sql`.
- [ ] Ejecutar `supabase/migrations/20260921000300_editorial_member_management.sql`.
- [ ] Ejecutar `supabase/02-seed.sql` solo si se quiere el seed. A re-verificar: el 2026-09-15 ya estaba aplicado.
- [ ] Registrar colaboradores en `verified_contributors`. A re-verificar: el 2026-09-15 ya había colaboradores.
- [ ] Confirmar el bucket `dwell-media`. A re-verificar: el 2026-09-15 ya existía.
- [ ] Dar de alta el primer `owner` en `editorial_members` con su `auth_user_id`.
- [ ] Invitar colaboradores mediante `/admin/review` y comprobar el vínculo Auth ↔ `verified_contributors`.

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

- [ ] **Prueba de subida de fotos en `/contribuir` (obligatoria).**

  Contexto (hallazgo del 26-09-2026): en la primera publicación de prueba (post `community-33f1c1ee`, "5 esquinas") la foto se veía de baja calidad. Causa: el archivo subido era de 399×501 px y 44 KB, sin EXIF (probablemente descargado o ya reducido). La app no comprime al subir: `app/api/submissions/route.ts` guarda los bytes tal cual. La portada del post (`app/journal/[slug]/page.tsx`) usa un contenedor `aspect-[16/9]` casi a todo el ancho con `object-cover`, que amplía y recorta las fotos pequeñas o verticales. Además, Next recomprime a AVIF con `q=70` (`next.config.ts`, `qualities: [70]`).

  Casos a probar. En cada uno, documentar el resultado y el error que ve el usuario:

  1. JPEG de buena calidad (≥1600 px en el lado mayor, <4 MB): debe publicarse y verse nítido en la portada del post, en la home y en `/journal`.
  2. JPEG de entre ~4,5 y 8 MB: la UI dice "máx. 8 MB", pero Vercel limita el cuerpo de la función a ~4,5 MB. Comprobar qué error aparece y si se entiende.
  3. JPEG de más de 8 MB: comprobar el mensaje de validación.
  4. Foto HEIC de iPhone y PNG: solo se acepta JPEG. Comprobar qué pasa.
  5. JPEG pequeño (<1000 px): hoy se acepta sin aviso. Comprobar cómo se ve.
  6. Foto vertical de alta resolución: comprobar el recorte en la portada 16:9.

  Posibles soluciones a evaluar después de la prueba:

  - Validar una resolución mínima (~1600 px) con un mensaje claro.
  - Subir directamente a Supabase Storage con URL firmada (`createSignedUploadUrl`) para evitar el límite de 4,5 MB de Vercel, o redimensionar en el cliente a ~2560 px en JPEG con calidad ≈0,85.
  - Mostrar la portada con la proporción real de la imagen en vez de forzar 16:9.
  - Usar `qualities: [70, 85]` y `quality={85}` en la portada del post y en el destacado de la home.
  - Aceptar HEIC y PNG convirtiéndolos a JPEG.
  - Mostrar mensajes de error claros en cada caso.

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
- [ ] Confirmar que Meta puede descargar imágenes del bucket público.

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
- [x] `ADMIN_TOKEN` no llega al navegador. La cookie `dh_admin` es httpOnly y el secreto se compara en el servidor (`lib/editorial-auth.ts`). Sigue como fallback temporal.
- [x] No hay publicación automática. Aprobar en `/admin/review` pide confirmación y solo entonces inserta `journal_posts` con `status='published'`.
- [x] La web es la URL canónica. `lib/site.ts` expone `siteUrl` y `canonicalFor`.
- [ ] Evitar URLs firmadas que Meta no pueda leer cuando exista la publicación en redes (Paso 7).

## Estado de validación local y de testing

- `npm run lint`, `npm test` y `npm run build` pasan en la revisión del 2026-09-25. La build no necesita secretos reales de Supabase. Con URL y service role de ejemplo, `/` sigue en ISR de una hora.
- `npm test` pasa 17 pruebas y omite 1 E2E HTTP porque no hay variables `E2E_*`.
- La tabla de rutas vigente está en `docs/Tech/03-frontend-rutas-render.md`. La cifra 19 es anterior a iconos, `robots.txt`, manifiesto y los slugs prerenderizados de `/embed`.
- Lighthouse local (móvil y escritorio, `next start`) está en `docs/Tech/07-rendimiento.md`.
- El E2E, cuando se configura, valida autenticación requerida, derechos obligatorios, colaborador desconocido, submission válida, persistencia y limpieza.
- RLS no devuelve filas a la clave publishable para `editorial_members`, `moderation_events` ni `verified_contributors`.
- Testing tiene aplicadas `20260921000100_contributor_auth.sql`, `20260921000200_editorial_permissions.sql` y `20260921000300_editorial_member_management.sql`.
- Testing tiene un `owner` activo en `editorial_members`, distinto del colaborador E2E. Ese colaborador no se promueve a `owner`.
- Producción no tiene aplicadas estas migraciones editoriales.
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
