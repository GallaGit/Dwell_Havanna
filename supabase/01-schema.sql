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
  display_name text,
  source text check (source in ('ig', 'fb', 'direct')),
  added_at timestamptz not null default now()
);

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

-- ── Storage público para medios ──
insert into storage.buckets (id, name, public)
values ('dwell-media', 'dwell-media', true)
on conflict (id) do nothing;

drop policy if exists "dwell-media public read" on storage.objects;
create policy "dwell-media public read"
  on storage.objects for select
  using (bucket_id = 'dwell-media');
-- Escritura: solo service_role (default, sin policy de insert pública).
