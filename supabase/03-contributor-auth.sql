-- Dwell Havana — colaboradores invitados
-- En una base nueva, ejecutar después de 01-schema.sql: la tabla tiene que existir.
-- Si verified_contributors ya existe sin auth_user_id, ejecutar este archivo
-- antes de 01-schema.sql. El índice de 01-schema.sql referencia esa columna.
alter table verified_contributors
  add column if not exists auth_user_id uuid unique;

create index if not exists verified_contributors_auth_user_idx
  on verified_contributors (auth_user_id);

comment on column verified_contributors.auth_user_id is
  'Supabase Auth user id assigned by an admin invitation; null means not yet invited.';
