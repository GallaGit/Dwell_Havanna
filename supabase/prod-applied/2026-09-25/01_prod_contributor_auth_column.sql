-- PROD PLAN · Paso 1/4 · migration name: prod_01_contributor_auth_column
-- Proyecto: sfujmwumtzuzwwhfmyxa (Dwell_Havanna_DB). NO aplicado.
-- Contenido: supabase/03-contributor-auth.sql VERBATIM (blob c8badd3).
-- DESVIACIÓN DE ORDEN: se ejecuta ANTES de 01-schema.sql porque producción tiene
-- la versión antigua de verified_contributors (sin auth_user_id). El 01-schema.sql
-- actual incluye `create index ... on verified_contributors (auth_user_id)`, que
-- fallaría con "column auth_user_id does not exist" si 01 corre primero.
-- Efecto en prod: añade verified_contributors.auth_user_id uuid + UNIQUE
-- (verified_contributors_auth_user_id_key), índice verified_contributors_auth_user_idx y comentario.
-- ─────────────────────────────────────────────────────────────────────────────
-- Dwell Havana — colaboradores invitados
-- Ejecutar después de 01-schema.sql en el mismo proyecto Supabase.
alter table verified_contributors
  add column if not exists auth_user_id uuid unique;

create index if not exists verified_contributors_auth_user_idx
  on verified_contributors (auth_user_id);

comment on column verified_contributors.auth_user_id is
  'Supabase Auth user id assigned by an admin invitation; null means not yet invited.';
