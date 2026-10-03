-- PROD PLAN · Pre-flight (SOLO LECTURA). Ejecutar con execute_sql antes del paso 1.
-- Resultado esperado (estado observado 25-09-2026 ~19:45 CEST):
--   verified_contributors_has_auth_user_id = false
--   editorial_members_exists = false, moderation_events_exists = false
--   filas = 0 en las 5 tablas, public_policies = 0, storage_policy = 1, bucket = 1
-- Si algo difiere, PARAR y re-planificar.
select
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='verified_contributors'
            and column_name='auth_user_id')                          as verified_contributors_has_auth_user_id,
  to_regclass('public.editorial_members') is not null               as editorial_members_exists,
  to_regclass('public.moderation_events') is not null               as moderation_events_exists,
  (select count(*) from public.properties)                          as properties_rows,
  (select count(*) from public.journal_posts)                       as journal_posts_rows,
  (select count(*) from public.verified_contributors)               as verified_contributors_rows,
  (select count(*) from public.submissions)                         as submissions_rows,
  (select count(*) from public.syndications)                        as syndications_rows,
  (select count(*) from pg_policies where schemaname='public')      as public_policies,
  (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
     and policyname='dwell-media public read')                      as storage_policy,
  (select count(*) from storage.buckets where id='dwell-media' and public) as bucket,
  (select count(*) from auth.users)                                 as auth_users;
