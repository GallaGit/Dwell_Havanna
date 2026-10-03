-- PROD PLAN · Paso 4/4 · migration name: prod_04_editorial_member_management
-- Contenido: supabase/migrations/20260921000300_editorial_member_management.sql VERBATIM (blob 253da01).
-- Efecto en prod: amplía moderation_events_action_check a 6 acciones
-- (+ invite_editorial_member, change_editorial_role, change_editorial_status).
-- ─────────────────────────────────────────────────────────────────────────────
-- Dwell Havana - gestión de miembros editoriales y auditoría de permisos
-- Aplicar después de 20260921000200_editorial_permissions.sql.

alter table moderation_events
  drop constraint if exists moderation_events_action_check;

alter table moderation_events
  add constraint moderation_events_action_check check (
    action in (
      'invite_contributor',
      'approve_submission',
      'reject_submission',
      'invite_editorial_member',
      'change_editorial_role',
      'change_editorial_status'
    )
  );
