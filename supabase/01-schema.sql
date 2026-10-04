-- Dwell Havana — Fase 1: schema canónico
-- Aplicar en Supabase Dashboard → SQL Editor, en este orden:
--   1) 01-schema.sql (este archivo)
--   2) 03-contributor-auth.sql
--   3) 04-editorial-permissions.sql
--   4) migrations/20260921000300_editorial_member_management.sql
--   5) migrations/20261003150500_private_dwell_media.sql
--   6) migrations/20261003231500_rls_revoke_rate_limit.sql
--   7) 02-seed.sql (opcional)
-- El orden vivo está en scripts/apply-canonical-sql.sh.
-- dwell-media es privado. Las fotos publicadas van a dwell-published.
--
-- Si verified_contributors ya existe sin auth_user_id, ejecuta
-- 03-contributor-auth.sql antes de este archivo. create table if not exists
-- no altera la tabla vieja, y el índice verified_contributors_auth_user_idx
-- falla con column "auth_user_id" does not exist. Producción se migró en
-- ese orden el 2026-09-25. Está pausada desde el 2026-10-03: al reactivarla
-- no reapliques este archivo.

-- ── Propiedades (espejo de type Property en lib/data.ts + workflow) ──
create table if not exists properties (
  slug text primary key,
  name text not null,
  location text not null,
  character text not null,
  description text not null,
  cover text not null,
  images text[] not null default '{}',
  facts jsonb not null default '[]',
  architecture text not null,
  interior text not null,
  story text not null,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

-- ── Journal (espejo de type JournalPost + cuerpo para Fase 2) ──
create table if not exists journal_posts (
  slug text primary key,
  title text not null,
  category text not null,
  excerpt text not null,
  image text not null,
  date_label text not null,
  reading_time text not null,
  body_mdx text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

-- ── Colaboradores verificados (allowlist: nadie fuera de aquí puede enviar) ──
create table if not exists verified_contributors (
  handle text primary key, -- ej. '@arq.habana'
  auth_user_id uuid unique,
  display_name text,
  source text check (source in ('ig', 'fb', 'direct')),
  added_at timestamptz not null default now()
);
create index if not exists verified_contributors_auth_user_idx
  on verified_contributors (auth_user_id);

-- ── Inbox de ingesta (formulario + Fase 3 webhooks Meta) ──
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  author_handle text references verified_contributors (handle),
  image_url text not null,
  caption_raw text not null,
  source text not null check (source in ('form', 'ig', 'fb')),
  external_id text unique, -- id del DM/post origen si viene de Meta (deduplicación)
  rights_granted boolean not null default false, -- sin true NO se publica
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ── Log de sindicación (Fase 2: qué se empujó a cada red) ──
create table if not exists syndications (
  id uuid primary key default gen_random_uuid(),
  post_type text not null check (post_type in ('property', 'journal')),
  post_slug text not null,
  target text not null, -- 'fb', 'ig', 'partner:<nombre>'
  external_id text,
  external_url text,
  status text not null default 'queued'
    check (status in ('queued', 'published', 'failed')),
  error text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists syndications_slug_idx
  on syndications (post_type, post_slug);

-- ── Defensa en profundidad ──
-- Todo el acceso de la app va vía service_role (bypass RLS).
-- Con RLS activado y SIN policies, anon/authenticated no leen ni escriben nada
-- aunque una tabla quede expuesta en la Data API por error.
alter table properties enable row level security;
alter table journal_posts enable row level security;
alter table verified_contributors enable row level security;
alter table submissions enable row level security;
alter table syndications enable row level security;

-- ── Storage ──
-- Un bucket público sirve cualquier objeto cuya URL se conozca: el flag
-- `public` no respeta prefijos. Los envíos sin moderar van a `dwell-media`
-- (privado, sin policy de SELECT). Al aprobar, el servidor copia el JPEG a
-- `dwell-published`, que sí es público y solo recibe esa copia.
--
-- INSERT ... ON CONFLICT DO NOTHING no cambia `public` si el bucket ya
-- existía como público. El DO UPDATE y el UPDATE de abajo sí lo dejan privado.

insert into storage.buckets (id, name, public)
values ('dwell-media', 'dwell-media', false)
on conflict (id) do update
  set public = false;

update storage.buckets
set public = false
where id = 'dwell-media';

insert into storage.buckets (id, name, public)
values ('dwell-published', 'dwell-published', true)
on conflict (id) do update
  set public = true;

drop policy if exists "dwell-media public read" on storage.objects;
drop policy if exists "dwell-media published read" on storage.objects;
-- Sin policy de SELECT: anon no lista el inventario. dwell-published, al ser
-- público, igual responde la URL concreta de una foto ya aprobada.
-- Escritura: solo service_role (sin policy de INSERT).
