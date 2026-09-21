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
