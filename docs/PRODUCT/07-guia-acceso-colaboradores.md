# 07 — Guía de acceso para colaboradores

Esta guía explica cómo funciona el acceso por invitación y cómo usarlo para enviar contenido a Dwell Havana.

## Qué significa una invitación

Dwell Havana no tiene registro público. La editora decide qué colaboradores pueden enviar contenido.

El acceso une dos datos:

- El **email** que recibe la invitación.
- El **handle** editorial registrado en `verified_contributors`, por ejemplo `@arq.habana`.

Supabase Auth verifica la identidad del email. La tabla `verified_contributors` verifica qué handle puede usar esa cuenta.

Una cuenta autenticada no puede enviar contenido usando el handle de otra persona.

## Flujo completo

El flujo tiene cinco pasos:

1. La editora registra el handle del colaborador.
2. La editora invita el email desde `/admin/review`.
3. El colaborador abre el enlace recibido por email.
4. El colaborador inicia sesión y envía contenido desde `/contribuir`.
5. La editora revisa el envío antes de publicarlo.

La invitación permite enviar contenido. No publica contenido de forma automática.

## Permisos editoriales futuros

El panel ya acepta cuentas editoriales individuales mediante Supabase Auth. `ADMIN_TOKEN` queda como fallback temporal para la propietaria hasta validar el primer `owner`.

La versión prevista dará a cada miembro editorial una cuenta individual de Supabase y un permiso asignado por la propietaria:

| Rol | Función |
|---|---|
| `contributor` | Envía contenido y espera revisión. |
| `moderator` | Revisa, aprueba y rechaza envíos. No gestiona permisos. |
| `owner` | Gestiona colaboradores, moderadores, permisos y publicación. |

La propietaria otorgará o retirará estos permisos desde un panel editorial. Cada moderador usará su propia cuenta. El sistema registrará quién aprobó o rechazó cada envío.


El orden de implementación está documentado en `docs/PRODUCT/roadmap.md`, sección **Evolución de permisos editoriales**.

En el proyecto de testing, las migraciones editoriales ya están aplicadas. El usuario
E2E existente pertenece al flujo de colaborador y no debe recibir el rol `owner`.
Para validar el panel, usa una cuenta editorial separada y regístrala en
`editorial_members`.

## Para la editora

### 1. Registrar al colaborador

Antes de enviar una invitación, el handle debe existir en `verified_contributors`.

Ejemplo:

```text
handle: @arq.habana
display_name: Arquitectura Habana
source: ig
```

La cuenta todavía no puede iniciar sesión hasta que reciba una invitación.

Si el handle no existe, el formulario de invitación no puede asociar el email con un colaborador.

### 2. Enviar la invitación

1. Abre `/admin/review`.
2. Inicia sesión con el `ADMIN_TOKEN`.
3. Busca la sección **Invitar colaborador**.
4. Escribe el handle existente, por ejemplo `@arq.habana`.
5. Escribe el email del colaborador.
6. Selecciona **Enviar invitación**.

Supabase enviará un email de acceso al colaborador.

La aplicación guarda el identificador de la cuenta invitada en `verified_contributors.auth_user_id`. Ese vínculo permite comprobar que el email y el handle pertenecen al mismo colaborador.

### 3. Confirmar un envío

Cuando el colaborador envía una foto, el envío aparece en `/admin/review` con estado `pending`.

La editora puede:

- Rechazar el envío.
- Aprobarlo para publicarlo en Journal.

Antes de cada decisión, el panel pide confirmación. Aprobar cambia el envío a `approved`, crea una entrada `journal_posts` con estado `published` y la hace visible en el Journal. Rechazar cambia el envío a `rejected` y lo retira de la cola pendiente.

## Para el colaborador

### 1. Abrir el enlace de invitación

Abre el enlace del email de Supabase desde el mismo navegador en el que quieres trabajar.

El enlace pasa por `/auth/callback`. La aplicación cambia el código temporal por una sesión y te redirige a `/contribuir`.

No compartas el enlace de acceso. Es de un solo uso.

### 2. Solicitar otro enlace

Si el enlace expiró o ya se usó:

1. Abre `/iniciar-sesion`.
2. Escribe el email que recibió la invitación.
3. Selecciona **Enviar enlace**.
4. Revisa la bandeja de entrada y la carpeta de spam.

Solo los emails invitados pueden recibir acceso. El formulario no crea cuentas nuevas.

### 3. Enviar una foto

En `/contribuir` completa estos campos:

- Tu handle de colaborador.
- Un título opcional de hasta 140 caracteres.
- Un caption de hasta 2.000 caracteres.
- Una imagen JPEG de hasta 8 MB.
- La confirmación de que tienes derecho a compartir la imagen.

Selecciona el botón de envío después de revisar los datos.

La aplicación guarda el contenido como `pending`. El contenido no aparece en la web hasta que la editora lo revise y confirme su publicación.

## Correcciones y retiro de contenido

Esta capacidad queda fuera del hito actual. La aplicación todavía no permite que un colaborador vea, edite, retire o elimine sus envíos desde el sitio.

La política prevista para una fase posterior es la siguiente:

- Un colaborador podrá editar el texto, reemplazar la imagen o retirar un envío mientras esté `pending`.
- Un colaborador podrá corregir y reenviar un envío `rejected`.
- Un colaborador podrá solicitar una corrección o el retiro de un envío `approved` o publicado.
- Un colaborador no podrá editar directamente contenido aprobado o publicado.
- Un `moderator` o `owner` decidirá si reabre, corrige, retira o restaura el contenido.
- El sistema conservará el historial y evitará el borrado físico como operación normal.

Los estados previstos para ese flujo son `change_requested`, `withdrawal_requested`, `withdrawn` y `unpublished`. Estos estados no existen todavía en la base de datos.

Las solicitudes deberán registrar quién las creó, cuándo se crearon y qué envío afectan. La implementación también deberá registrar en `moderation_events` las decisiones editoriales relacionadas.

## Cómo se valida el acceso

La API comprueba dos condiciones antes de aceptar un envío:

1. Existe una sesión válida de Supabase Auth.
2. La sesión está vinculada al handle enviado.

El sistema responde con estos errores cuando una condición falla:

| Situación | Respuesta | Qué hacer |
|---|---|---|
| No existe una sesión | `401 authentication_required` | Abre `/iniciar-sesion` y usa el enlace recibido. |
| La cuenta no está vinculada al handle | `403 unknown_contributor` | Comprueba el handle o contacta con la editora. |
| Falta la confirmación de derechos | `422 rights_required` | Marca la confirmación antes de enviar. |
| La imagen no es JPEG | `422 photo_must_be_jpeg` | Convierte la imagen a `.jpg` o `.jpeg`. |
| La imagen supera 8 MB | `422 photo_too_large_8mb` | Reduce el tamaño de la imagen. |
| Supabase no está configurado | `503 auth_not_configured` | Contacta con la persona que administra la aplicación. |

## Ejemplo de autorización correcta

La cuenta invitada de `camila@example.com` queda vinculada así:

```text
handle: @camila_arq
auth_user_id: 12345678-abcd-....
```

Cuando esa cuenta envía `@camila_arq`, la aplicación acepta el envío.

Si la misma cuenta intenta enviar `@otra-persona`, la aplicación responde `403 unknown_contributor`.

## Seguridad y privacidad

- No compartas el enlace de acceso.
- No introduzcas el `ADMIN_TOKEN` en la página de colaboradores.
- No guardes cookies de sesión en capturas de pantalla ni en mensajes.
- Usa un proyecto Supabase de testing para las pruebas automatizadas.
- No uses `E2E_AUTH_COOKIE` contra producción.
- La editora debe revisar los derechos de cada imagen antes de aprobarla.

## Dónde probar el flujo

Para una prueba manual local:

1. Configura Supabase y las variables de entorno descritas en `docs/Tech/06-config-operacion.md`.
2. Ejecuta `npm run dev`.
3. Abre `/admin/review` e invita un email asociado a un handle existente.
4. Abre el enlace recibido.
5. Envía una imagen desde `/contribuir`.
6. Confirma el envío desde `/admin/review`.

Para la prueba automatizada del envío autenticado, configura las variables `E2E_*` descritas en `tests/submissions-http.e2e.test.mjs` y ejecuta:

```bash
npm test
```

La prueba usa un proyecto Supabase dedicado y elimina el envío y el archivo temporal al terminar.
