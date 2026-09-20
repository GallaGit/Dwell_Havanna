-- Dwell Havana — colaboradores invitados
-- Ejecutar después de 01-schema.sql en el mismo proyecto Supabase.
alter table verified_contributors
  add column if not exists auth_user_id uuid unique;

create index if not exists verified_contributors_auth_user_idx
  on verified_contributors (auth_user_id);

comment on column verified_contributors.auth_user_id is
  'Supabase Auth user id assigned by an admin invitation; null means not yet invited.';
