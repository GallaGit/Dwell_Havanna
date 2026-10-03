-- DH-SEC-013 y DH-SEC-004.
-- Idempotente. Aplicar en el SQL Editor del proyecto, o al final del
-- orden de scripts/apply-canonical-sql.sh. No lo ejecuta un agente.
--
-- REVOKE quita los GRANT por defecto de anon, authenticated y PUBLIC.
-- FORCE ROW LEVEL SECURITY no afecta a service_role: en Supabase ese
-- rol tiene BYPASSRLS y sigue leyendo y escribiendo la cola, las
-- invitaciones y el límite de ritmo.
--
-- La policy published_read deja que la clave publishable lea solo filas
-- con status = published, y solo las columnas que el sitio público usa.
-- body_mdx no se concede. submissions, colaboradores y el equipo siguen
-- sin policy y sin GRANT para anon.

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  window_start timestamptz not null,
  hit_count integer not null check (hit_count > 0),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;
alter table public.journal_posts enable row level security;
alter table public.verified_contributors enable row level security;
alter table public.submissions enable row level security;
alter table public.syndications enable row level security;
alter table public.editorial_members enable row level security;
alter table public.moderation_events enable row level security;
alter table public.rate_limit_buckets enable row level security;

alter table public.properties force row level security;
alter table public.journal_posts force row level security;
alter table public.verified_contributors force row level security;
alter table public.submissions force row level security;
alter table public.syndications force row level security;
alter table public.editorial_members force row level security;
alter table public.moderation_events force row level security;
alter table public.rate_limit_buckets force row level security;

revoke all on table public.properties from public, anon, authenticated;
revoke all on table public.journal_posts from public, anon, authenticated;
revoke all on table public.verified_contributors from public, anon, authenticated;
revoke all on table public.submissions from public, anon, authenticated;
revoke all on table public.syndications from public, anon, authenticated;
revoke all on table public.editorial_members from public, anon, authenticated;
revoke all on table public.moderation_events from public, anon, authenticated;
revoke all on table public.rate_limit_buckets from public, anon, authenticated;

grant all on table public.properties to service_role;
grant all on table public.journal_posts to service_role;
grant all on table public.verified_contributors to service_role;
grant all on table public.submissions to service_role;
grant all on table public.syndications to service_role;
grant all on table public.editorial_members to service_role;
grant all on table public.moderation_events to service_role;
grant all on table public.rate_limit_buckets to service_role;

grant select (
  slug,
  name,
  location,
  character,
  description,
  cover,
  images,
  facts,
  architecture,
  interior,
  story,
  status,
  published_at
) on table public.properties to anon, authenticated;

grant select (
  slug,
  title,
  category,
  excerpt,
  image,
  date_label,
  reading_time,
  status,
  published_at
) on table public.journal_posts to anon, authenticated;

drop policy if exists "properties_published_read" on public.properties;
create policy "properties_published_read"
  on public.properties
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "journal_posts_published_read" on public.journal_posts;
create policy "journal_posts_published_read"
  on public.journal_posts
  for select
  to anon, authenticated
  using (status = 'published');

-- Un solo incremento por clave, atómico ante dos requests a la vez.
-- SECURITY INVOKER: corre como service_role, que es quien tiene GRANT.
-- anon no tiene EXECUTE. Una clave inválida devuelve false (no cuenta).
create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if p_key is null
     or char_length(p_key) < 12
     or char_length(p_key) > 200
     or p_limit is null
     or p_limit < 1
     or p_limit > 1000
     or p_window_seconds is null
     or p_window_seconds < 1
     or p_window_seconds > 86400
  then
    return false;
  end if;

  insert into public.rate_limit_buckets as bucket (bucket_key, window_start, hit_count)
  values (p_key, v_now, 1)
  on conflict (bucket_key) do update
  set
    window_start = case
      when bucket.window_start + (p_window_seconds * interval '1 second') <= v_now then v_now
      else bucket.window_start
    end,
    hit_count = case
      when bucket.window_start + (p_window_seconds * interval '1 second') <= v_now then 1
      else bucket.hit_count + 1
    end,
    updated_at = v_now
  returning hit_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

comment on table public.rate_limit_buckets is
  'Contadores de ritmo. La clave es un hash, no el email ni la IP en claro. service_role únicamente.';
comment on function public.consume_rate_limit(text, integer, integer) is
  'Incrementa el contador de la ventana y devuelve true si el intento cabe en el límite.';
