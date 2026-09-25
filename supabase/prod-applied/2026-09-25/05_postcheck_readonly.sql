-- PROD PLAN · Verificación posterior (SOLO LECTURA). Esperado = testing sin seed:
--   7 tablas public con rls=true y 0 policies cada una;
--   verified_contributors.auth_user_id existe con UNIQUE + índice;
--   moderation_events_action_check con 6 acciones;
--   storage policy "dwell-media public read" = 1; bucket dwell-media public = true;
--   editorial_members = 0 filas hasta el alta manual del owner.
select c.relname as tbl, c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policies
from pg_class c
where c.relnamespace='public'::regnamespace and c.relkind='r'
order by 1;

select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def
from pg_constraint
where connamespace='public'::regnamespace
  and conname in ('verified_contributors_auth_user_id_key','moderation_events_action_check',
                  'editorial_members_auth_user_id_fkey','moderation_events_actor_user_id_fkey',
                  'moderation_events_submission_id_fkey','moderation_events_target_handle_fkey');

select indexname from pg_indexes where schemaname='public' order by 1;
