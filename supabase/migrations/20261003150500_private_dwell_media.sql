-- Deja dwell-media privado en un proyecto donde ya existía como público
-- y crea dwell-published para las copias aprobadas.
--
-- Idempotente. Aplicar en un proyecto que ya ejecutó el SQL canónico
-- anterior, sin reaplicar 01-schema.sql. También va en
-- scripts/apply-canonical-sql.sh, después de la gestión de miembros.
--
-- No mueve objetos. Las fotos ya guardadas se migran con
-- scripts/migrate-dwell-media-objects.mjs (dry-run por defecto).
--
-- INSERT ... ON CONFLICT DO NOTHING no cambia el flag public. Aquí el
-- conflicto actualiza el flag, y el UPDATE lo refuerza.

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
