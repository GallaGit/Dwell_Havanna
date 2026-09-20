-- Dwell Havana - permisos editoriales y auditoría
-- Ejecutar después de 03-contributor-auth.sql.

create table if not exists editorial_members (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'moderator')),
  active boolean not null default true,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editorial_members_active_role_idx
  on editorial_members (active, role);

create table if not exists moderation_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_source text not null default 'auth'
    check (actor_source in ('auth', 'legacy_admin')),
  action text not null
    check (action in ('invite_contributor', 'approve_submission', 'reject_submission')),
  submission_id uuid references submissions (id) on delete set null,
  target_handle text references verified_contributors (handle) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moderation_events_actor_created_idx
  on moderation_events (actor_user_id, created_at desc);
create index if not exists moderation_events_submission_idx
  on moderation_events (submission_id, created_at desc);

alter table editorial_members enable row level security;
alter table moderation_events enable row level security;

comment on table editorial_members is
  'Server-managed editorial identities. Authorization uses auth_user_id, role and active.';
comment on table moderation_events is
  'Append-only audit records for editorial actions.';
