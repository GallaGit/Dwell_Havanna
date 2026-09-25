# SQL aplicado en producción el 2026-09-25

Registro de lo que se ejecutó en `sfujmwumtzuzwwhfmyxa` (Dwell_Havanna_DB) el 2026-09-25, entre las 20:25 y las 20:26 CEST. El estado resultante y el procedimiento vigente están en `docs/Tech/08-estado-supabase-2026-09-25.md`.

Esta carpeta no es una migración del CLI. `supabase db push` solo lee `supabase/migrations/`. No vuelvas a aplicar estos archivos sobre producción: el esquema ya está.

El historial `supabase_migrations.schema_migrations` guarda el SQL de los archivos de migración, con los comentarios de cabecera recortados. `00_preflight_readonly.sql` y `05_postcheck_readonly.sql` fueron lecturas y no tienen versión.

| Archivo | Versión en el historial | Nombre |
|---|---|---|
| `00_preflight_readonly.sql` | — | lectura previa |
| `00b_remove_test_contributors.sql` | `20260925182536` | `remove_test_contributors` |
| `01_prod_contributor_auth_column.sql` | `20260925182555` | `prod_01_contributor_auth_column` |
| `02_prod_canonical_01_schema.sql` | `20260925182605` | `prod_02_canonical_01_schema` |
| `03_prod_editorial_permissions.sql` | `20260925182613` | `prod_03_editorial_permissions` |
| `04_prod_editorial_member_management.sql` | `20260925182620` | `prod_04_editorial_member_management` |
| `05_postcheck_readonly.sql` | — | lectura posterior |
| `99_optional_revoke_rls_auto_enable.sql` | `20260925182626` | `prod_optional_revoke_rls_auto_enable` |

Dos textos de estos archivos quedaron del plan anterior a la ejecución:

- Varias cabeceras dicen «NO aplicado». Sí se aplicaron, en el orden de la tabla.
- `00_preflight_readonly.sql` comenta que esperaba 0 filas. La lectura corregida, antes del borrado, era el seed (3 `properties`, 4 `journal_posts`) y 2 colaboradores de prueba. El seed se conservó. El borrado está en `00b_remove_test_contributors.sql`.
- `02_prod_canonical_01_schema.sql` incluye la cabecera de `01-schema.sql` tal como se aplicó, con la ruta `site/lib/data.ts`. Esa cabecera se corrigió después en `supabase/01-schema.sql`, `supabase/02-seed.sql` y `supabase/03-contributor-auth.sql`. Las sentencias SQL no cambiaron.
