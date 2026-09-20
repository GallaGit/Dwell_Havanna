# Dwell Havana roadmap

Estado actualizado: 2026-09-20

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
- [x] Aprobar submissions como borradores de Journal.
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
- [x] Verificar 19 rutas generadas en la build documentada.
- [x] Resolver el bloqueo histórico `403 unknown_contributor` con un servidor de desarrollo fresco.
- [x] Documentar el problema local de certificados TLS sin incorporarlo al código ni a la configuración de producción.

## Paso 1: cerrar la optimización local

Cambios actualmente presentes en el árbol de trabajo:

- [x] Añadir formatos AVIF y WebP en `next.config.ts`.
- [x] Añadir `minimumCacheTTL` para imágenes optimizadas.
- [x] Definir `quality={70}` en imágenes editoriales.
- [x] Definir `sizes` responsive en las imágenes principales.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [ ] Revisar visualmente home, property detail y journal detail en móvil y escritorio.
- [x] Mantener estos cambios separados de las tareas de producción hasta verificar que no degradan la calidad editorial.

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

## Evolución de permisos editoriales

Esta evolución reemplazará el uso compartido de `ADMIN_TOKEN` para cualquier persona que necesite permisos editoriales. `ADMIN_TOKEN` queda, de forma temporal, como acceso de emergencia para la propietaria hasta que exista el primer usuario `owner`.

### Modelo decidido

- [ ] Mantener `verified_contributors` para las identidades que pueden enviar contenido.
- [ ] Crear identidades editoriales individuales con Supabase Auth.
- [ ] Crear una tabla de miembros editoriales con roles `owner` y `moderator`.
- [ ] Permitir que solo la propietaria otorgue, retire o cambie permisos.
- [ ] Añadir un estado activo para revocar el acceso sin borrar el historial.
- [ ] Registrar quién y cuándo ejecutó cada acción de moderación.
- [ ] No usar `ADMIN_TOKEN` para moderadores.

### Roles y permisos

| Rol | Puede enviar | Puede revisar | Puede aprobar o rechazar | Puede invitar colaboradores | Puede gestionar permisos | Puede publicar |
|---|---:|---:|---:|---:|---:|---:|
| `contributor` | Sí | No | No | No | No | No |
| `trusted_contributor` | Sí | No | No | No | No | No |
| `moderator` | Opcional | Sí | Sí | No | No | No por defecto |
| `owner` | Opcional | Sí | Sí | Sí | Sí | Sí |

`trusted_contributor` no será un bypass de seguridad. La API seguirá exigiendo una sesión válida y el vínculo entre `auth_user_id` y `handle`.

El permiso de confianza permitirá marcar el envío como aprobado automáticamente y crear un borrador de Journal. El borrador seguirá necesitando una acción editorial para publicarse. La publicación automática queda fuera de esta fase.

### Orden obligatorio de implementación

1. **Definir el modelo de permisos**
   - Elegir los nombres finales de tablas, roles y acciones.
   - Definir qué puede hacer cada rol.
   - Confirmar que publicar y gestionar permisos quedan reservados a `owner`.

2. **Crear el esquema de roles**
   - Crear una migración para `editorial_members`.
   - Añadir `role`, `active`, `display_name`, `created_at` y `updated_at`.
   - Añadir el campo de confianza a `verified_contributors`.
   - Crear `moderation_events` para la auditoría.
   - Mantener RLS activo y usar el cliente de servicio solo desde el servidor.

3. **Crear la autorización server-side**
   - Crear una única función que obtenga el miembro editorial desde la sesión Supabase.
   - Rechazar cuentas inexistentes o inactivas.
   - Comprobar permisos en cada Server Action y Route Handler.
   - No decidir permisos con `user_metadata`.

4. **Migrar el acceso de la propietaria**
   - Invitar la cuenta Supabase de la propietaria.
   - Vincularla con el rol `owner`.
   - Probar el acceso individual.
   - Mantener `ADMIN_TOKEN` solo como fallback temporal.

5. **Añadir moderadores**
   - Permitir que `owner` invite moderadores.
   - Permitir que `owner` active, desactive o cambie el rol de un miembro.
   - Mostrar en el panel la identidad de la persona autenticada.
   - Impedir que un moderador invite, desactive o eleve a otro moderador.

6. **Migrar la cola de moderación**
   - Proteger `/admin/review` con Supabase Auth y el rol editorial.
   - Permitir a `moderator` aprobar y rechazar submissions.
   - Guardar un evento de auditoría para cada decisión.
   - Rechazar dos decisiones simultáneas sobre el mismo envío.

7. **Añadir contribuidores de confianza**
   - Permitir que `owner` otorgue o retire `trusted_contributor`.
   - Mantener la validación de identidad y del handle.
   - Crear automáticamente el borrador de Journal tras un envío válido.
   - Mantener la publicación final bajo una acción editorial explícita.

8. **Añadir pruebas y retirar el fallback**
   - Cubrir cada rol y cada permiso negativo.
   - Probar la revocación de una cuenta activa.
   - Probar la auditoría de aprobaciones y rechazos.
   - Probar el flujo de confianza sin publicación directa.
   - Retirar `ADMIN_TOKEN` cuando el acceso `owner` individual esté verificado en producción.

### Casos que deben quedar cubiertos

- Un colaborador normal crea un envío `pending`.
- Un contribuidor de confianza crea un borrador sin entrar en la cola normal.
- Un moderador aprueba un envío y queda registrado como autor de la decisión.
- Un moderador rechaza un envío y queda registrado como autor de la decisión.
- Un moderador no puede invitar colaboradores.
- Un moderador no puede cambiar permisos.
- Un colaborador no puede abrir el panel editorial.
- Una cuenta desactivada pierde el acceso aunque conserve una sesión anterior.
- Un colaborador no puede enviar usando el handle de otra persona.
- Ningún flujo de confianza publica directamente durante esta fase.

## Paso 2: activar Supabase y producción

Requiere credenciales y acciones fuera del repositorio.

Este paso activa el modelo actual de Fase 1. La migración a cuentas editoriales individuales se ejecuta después de validar la aplicación base y antes de retirar `ADMIN_TOKEN`.

- [ ] Confirmar el proyecto Supabase de producción.
- [ ] Configurar `NEXT_PUBLIC_SITE_URL` con el dominio real.
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor.
- [ ] Generar un `ADMIN_TOKEN` largo y privado.
- [ ] Ejecutar `supabase/01-schema.sql` en Supabase SQL Editor.
- [ ] Ejecutar `supabase/02-seed.sql` en Supabase SQL Editor.
- [ ] Registrar colaboradores en `verified_contributors`.
- [ ] Invitar colaboradores mediante `/admin/review` y comprobar el vínculo Auth ↔ `verified_contributors`.
- [ ] Confirmar que el bucket `dwell-media` está configurado.
- [ ] Desplegar la aplicación.
- [ ] Confirmar que ninguna variable secreta se expone al navegador.

## Paso 3: repetir el E2E en producción

- [ ] Abrir `/contribuir` desde móvil.
- [ ] Enviar una foto de un colaborador autorizado.
- [ ] Confirmar que una cuenta no autorizada recibe `403`.
- [ ] Confirmar que un envío sin derechos recibe `422`.
- [ ] Revisar el envío en `/admin/review`.
- [ ] Aprobarlo y confirmar que crea un borrador.
- [ ] Editar y publicar el borrador desde la base de datos mientras no exista CMS.
- [ ] Confirmar que el contenido publicado aparece en la web.
- [ ] Confirmar `/feed.xml` en producción.
- [ ] Confirmar `/sitemap.xml` en producción.
- [ ] Validar un slug de property con Meta Sharing Debugger.
- [ ] Validar un slug de journal con Meta Sharing Debugger.
- [ ] Revisar la carga de imágenes desde Supabase Storage.

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

## Riesgos y controles

- [ ] No exponer `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] No exponer `ADMIN_TOKEN`.
- [ ] No permitir publicación automática sin moderación.
- [ ] Mantener RLS activo.
- [ ] Mantener validación de derechos de imagen.
- [ ] Mantener allowlist de colaboradores.
- [ ] Evitar URLs firmadas que Meta no pueda leer durante la publicación.
- [ ] Mantener la web como URL canónica para evitar duplicación SEO.

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
- `docs/PRODUCT/07-guia-acceso-colaboradores.md`
