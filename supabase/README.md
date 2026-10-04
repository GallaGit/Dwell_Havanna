# SQL

Hay un solo camino para aplicar el esquema: `scripts/apply-canonical-sql.sh`. Por defecto solo lista los archivos. Con `--apply` hace falta `DATABASE_URL` y `psql`, y se niega si la URL contiene el ref de producción salvo `--allow-production`.

`supabase/migrations/` no sustituye ese script. Guarda los cambios incrementales para una base que ya tiene el esquema. `supabase db push` sobre una base vacía no crea las tablas: no hay `config.toml` y las migraciones no incluyen el `CREATE TABLE` inicial. Copiar `01-schema.sql` dentro de `migrations/` y seguir aplicando también el script duplicaría el camino. Por eso el esquema base sigue en `supabase/01-schema.sql`, y cada cambio nuevo se añade como migración y al final de la lista del script.

Orden de una base nueva:

1. `supabase/01-schema.sql`
2. `supabase/03-contributor-auth.sql`
3. `supabase/04-editorial-permissions.sql`
4. `supabase/migrations/20260921000300_editorial_member_management.sql`
5. `supabase/migrations/20261003150500_private_dwell_media.sql`
6. `supabase/migrations/20261003231500_rls_revoke_rate_limit.sql`
7. `supabase/02-seed.sql`, solo si se quiere el contenido de ejemplo

En producción, que ya tenía el esquema del 2026-09-25, no reapliques `01-schema.sql`. Aplica las migraciones `20261003150500` y `20261003231500`.

`03-contributor-auth.sql` y `04-editorial-permissions.sql` coinciden con las migraciones `20260921000100` y `20260921000200`. El script usa los archivos sueltos. No ejecutes las dos copias en la misma base nueva: la segunda choca con objetos que ya existen. La de miembros (`20260921000300`) sí va en el script porque no tiene un duplicado suelto.
