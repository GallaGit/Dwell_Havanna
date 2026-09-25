# 08 — Estado de Supabase al 2026-09-25

Lectura de producción y de testing el 2026-09-25. El procedimiento para aplicar el SQL está en `docs/Tech/06-config-operacion.md`. Los archivos ejecutados en producción están en `supabase/prod-applied/2026-09-25/`.

## Producción

Proyecto `sfujmwumtzuzwwhfmyxa`, nombre Dwell_Havanna_DB, organización `oxfilxdghpzkqyvtjkiy`, región `ca-central-1`. Activo.

Antes del 2026-09-25 la base tenía el esquema anterior a `03-contributor-auth`: cinco tablas, `verified_contributors` sin `auth_user_id`, el seed del 2026-09-15 (3 `properties` y 4 `journal_posts`, todas `published`) y 2 colaboradores de prueba de Instagram.

### Aplicado el 2026-09-25, 20:25–20:26 CEST

Las versiones del historial están en UTC. El nombre es el de `supabase_migrations.schema_migrations`.

| Versión | CEST | Nombre | Equivale a |
|---|---|---|---|
| `20260925182536` | 20:25:36 | `remove_test_contributors` | `00b_remove_test_contributors.sql` |
| `20260925182555` | 20:25:55 | `prod_01_contributor_auth_column` | `supabase/03-contributor-auth.sql` |
| `20260925182605` | 20:26:05 | `prod_02_canonical_01_schema` | `supabase/01-schema.sql` |
| `20260925182613` | 20:26:13 | `prod_03_editorial_permissions` | `supabase/04-editorial-permissions.sql` |
| `20260925182620` | 20:26:20 | `prod_04_editorial_member_management` | `supabase/migrations/20260921000300_editorial_member_management.sql` |
| `20260925182626` | 20:26:26 | `prod_optional_revoke_rls_auto_enable` | `99_optional_revoke_rls_auto_enable.sql` |

`03-contributor-auth.sql` se ejecutó antes de `01-schema.sql`. En esa base la tabla ya existía sin `auth_user_id`, y el índice de `01-schema.sql` falla si la columna no está. El detalle está en la sección de deuda.

`prod_optional_revoke_rls_auto_enable` quita `EXECUTE` a `anon`, `authenticated` y `public` sobre `public.rls_auto_enable()`. Esa función es la que Supabase crea por defecto para el event trigger `ensure_rls`. El trigger sigue. La función solo queda ejecutable por `postgres` y `service_role`.

### Esquema y datos después de aplicarlo

Siete tablas, todas con RLS y cero policies: `properties`, `journal_posts`, `verified_contributors`, `submissions`, `syndications`, `editorial_members`, `moderation_events`. El acceso de la app sigue siendo `service_role` desde el servidor. Cero policies en `public` es intencional.

`verified_contributors.auth_user_id` es `uuid` con `UNIQUE`. En producción la columna quedó la última, porque se añadió con `ALTER TABLE`. Hay 14 índices. El check `moderation_events_action_check` admite 6 acciones: `invite_contributor`, `approve_submission`, `reject_submission`, `invite_editorial_member`, `change_editorial_role`, `change_editorial_status`.

Bucket `dwell-media`, público, con la policy `dwell-media public read`. Cero objetos.

| Tabla o sistema | Filas |
|---|---|
| `properties` | 3, el seed, `published` |
| `journal_posts` | 4, el seed, `published` |
| `verified_contributors` | 0 |
| `submissions`, `syndications`, `editorial_members`, `moderation_events` | 0 |
| Auth | 0 usuarios |
| Storage | 0 objetos |

Falta el primer `owner`. `editorial_members.auth_user_id` es clave foránea a `auth.users`, así que el orden es: invitar la cuenta de Ociel en Auth y, después, insertar la fila.

```sql
insert into editorial_members (auth_user_id, role, display_name)
values ('<auth-user-uuid>', 'owner', '<nombre editorial>');
```

También falta activar en el dashboard de Auth la protección de contraseñas filtradas. El resto del lanzamiento está en `docs/PRODUCT/roadmap.md`, Paso 2.

## Testing

Proyecto `ypeizxnafipvojpntsaw`, nombre Dwell_Havanna_Testing. Tiene el SQL canónico, el seed y estas versiones en el historial: `20260921000100`, `20260921000200`, `20260921000300` y `canonical_01_schema` (`20260925174404`).

No tiene la función `rls_auto_enable`.

La única diferencia de esquema con producción es el orden de `verified_contributors.auth_user_id`: en testing la columna está en la posición del `CREATE TABLE` de `01-schema.sql` (la segunda). En producción es la última.

| Dato | Testing |
|---|---|
| Usuarios Auth | 3 |
| `editorial_members` con rol `owner` y `active` | 2 |
| `verified_contributors` con `auth_user_id` | 2 |
| `submissions` | 2 |
| `moderation_events` | 3 |
| Post de comunidad en `journal_posts.status = 'review'` | 1 |

Hay dos `owner` activos. Documentos anteriores que decían uno quedan sustituidos por este recuento.

## Advisors

En producción, después de la migración, los advisors que quedan son INFO:

- `rls_enabled_no_policy` en las 7 tablas. Intencional: sin policy, `anon` y `authenticated` no leen ni escriben. El servidor usa `service_role`.
- Claves foráneas sin índice en la columna que referencia: `submissions.author_handle` y `moderation_events.target_handle`.
- 5 índices sin uso.

## Deuda conocida

Estas piezas siguen en el repositorio. No se reordenaron las migraciones en este registro.

### El orden 01 → 03 falla en el esquema anterior a 03

`supabase/01-schema.sql` crea `verified_contributors` con `auth_user_id` y, a continuación, el índice `verified_contributors_auth_user_idx`. `create table if not exists` no toca una tabla que ya existe. En el esquema viejo la columna no está, y el `create index` termina con `column "auth_user_id" does not exist`.

En una base nueva el orden 01 → 03 funciona: el `CREATE TABLE` ya incluye la columna. En producción, el 2026-09-25, el orden que funcionó fue 03 → 01. Hoy la columna ya existe, así que repetir 01 sobre producción es idempotente. El procedimiento de los dos casos está en `docs/Tech/06-config-operacion.md`.

### Índice duplicado en `auth_user_id`

`auth_user_id uuid unique` ya crea el índice `verified_contributors_auth_user_id_key`. `verified_contributors_auth_user_idx` repite esa columna. Está en `01-schema.sql`, en `03-contributor-auth.sql` y en `supabase/migrations/20260921000100_contributor_auth.sql`. Quitar uno es un cambio de esquema; no se hizo aquí.

### `03` y `04` duplican migraciones, y falta la migración base

`supabase/03-contributor-auth.sql` y `supabase/migrations/20260921000100_contributor_auth.sql` son el mismo cambio. `supabase/04-editorial-permissions.sql` y `supabase/migrations/20260921000200_editorial_permissions.sql` también.

`supabase/migrations/` no tiene el esquema base de `01-schema.sql`. En una base vacía, `supabase db push` y `supabase db reset` llegan a `20260921000100`, que hace `alter table verified_contributors`, y fallan porque la tabla no existe. El repositorio tampoco tiene `supabase/config.toml`. El camino para una base nueva sigue siendo el SQL canónico, no el CLI.

### El historial de producción no usa las versiones de `supabase/migrations/`

Las seis versiones de producción son timestamps del 2026-09-25. Testing tiene las tres de `supabase/migrations/` más `20260925174404`. Ningún archivo local se llama como las versiones de producción.

Antes de `supabase db push` contra producción o contra testing, alinea el historial. `supabase migration repair` solo escribe en `supabase_migrations.schema_migrations`. No ejecuta SQL y no deshace el esquema.

1. Enlaza el proyecto que vas a tocar: `supabase link --project-ref sfujmwumtzuzwwhfmyxa` o `ypeizxnafipvojpntsaw`.
2. Mira la diferencia: `supabase migration list`.
3. Marca como aplicadas las versiones locales cuyo efecto ya está en la base:

```bash
supabase migration repair --status applied 20260921000100
supabase migration repair --status applied 20260921000200
supabase migration repair --status applied 20260921000300
```

4. Quita del historial remoto las versiones que no tienen archivo en `supabase/migrations/`. En producción son estas seis. En testing, añade `20260925174404`.

```bash
supabase migration repair --status reverted 20260925182536
supabase migration repair --status reverted 20260925182555
supabase migration repair --status reverted 20260925182605
supabase migration repair --status reverted 20260925182613
supabase migration repair --status reverted 20260925182620
supabase migration repair --status reverted 20260925182626
```

5. Vuelve a `supabase migration list`. Local y remoto tienen que coincidir en `20260921000100`, `20260921000200` y `20260921000300`.
6. Solo entonces `supabase db push`.

Marca `applied` antes de `reverted`. Si reviertes primero y alguien lanza `db push`, el CLI intentará ejecutar `20260921000100`–`20260921000300`. En el esquema ya migrado esas tres son idempotentes, y aun así el historial debe quedar alineado antes del push.

`reverted` borra la fila del historial. El SQL aplicado se queda. Ejecútalo solo en el proyecto que acabas de listar.

Este repair no crea la migración base que falta. Sigue sin servir para una base vacía.
