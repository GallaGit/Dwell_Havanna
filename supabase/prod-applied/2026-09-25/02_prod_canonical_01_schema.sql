-- PROD PLAN · Paso 2/4 · migration name: prod_02_canonical_01_schema
-- Contenido: supabase/01-schema.sql VERBATIM (blob 962f0f3).
-- Tras el paso 1 es idempotente en prod: todas las tablas/índices/bucket ya existen
-- (create ... if not exists / on conflict do nothing / enable RLS no-op).
-- Único efecto real: drop + create de la policy "dwell-media public read" (idéntica),
-- atómico dentro de la transacción de la migración. Se incluye para dejar el
-- esquema base registrado y garantizar que prod coincide con el archivo canónico.
-- ─────────────────────────────────────────────────────────────────────────────
-- Dwell Havana — Fase 1: schema canónico
-- Aplicar en Supabase Dashboard → SQL Editor, en este orden:
--   1) 01-schema.sql (este archivo)
--   2) 02-seed.sql (contenido inicial migrado desde site/lib/data.ts)
-- Bucket público `dwell-media` para covers/galerías (lectura pública, escritura solo service_role).

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

-- ── Storage público para medios ──
insert into storage.buckets (id, name, public)
values ('dwell-media', 'dwell-media', true)
on conflict (id) do nothing;

drop policy if exists "dwell-media public read" on storage.objects;
create policy "dwell-media public read"
  on storage.objects for select
  using (bucket_id = 'dwell-media');
-- Escritura: solo service_role (default, sin policy de insert pública).
