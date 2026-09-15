-- Dwell Havana — Fase 1: seed migrado desde site/lib/data.ts (2026-09-15)
-- Aplicar DESPUÉS de 01-schema.sql. Idempotente (on conflict do update).

-- ── Properties ──
insert into properties
  (slug, name, location, character, description, cover, images, facts,
   architecture, interior, story, status, published_at)
values
  ('casa-miramar-1938',
   'Casa Miramar, 1938',
   'Miramar, Havana',
   'Modernist villa · courtyard · terrazzo',
   'A 1938 modernist villa where sea light moves across terrazzo, timber screens and a quiet central patio.',
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
   array[
     'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
     'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop',
     'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1600&auto=format&fit=crop',
     'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=1600&auto=format&fit=crop'
   ],
   '[{"label":"District","value":"Miramar"},{"label":"Year","value":"1938, restored 2021"},{"label":"Area","value":"340 m²"},{"label":"Type","value":"Single villa + patio"},{"label":"Materials","value":"Terrazzo, cedar, lime plaster"}]'::jsonb,
   'A compact modernist volume organised around a patio. Deep loggias temper the western sun; original steel windows were retained and repaired rather than replaced. The plan is simple — day rooms to the garden, night rooms above — allowing cross-ventilation through every principal space.',
   'Interiors keep the 1938 shell legible: terrazzo floors, cedar joinery, lime-washed walls. Furniture is low and quiet, Cuban mid-century pieces alongside contemporary craft. Light, not objects, is the decoration.',
   'Built by a Havana engineer for his family, the house passed through three generations before a careful restoration. Plaster scars were left visible in the stair hall — a record of habitation rather than a flaw to erase.',
   'published', now()),
  ('apartamento-vedado-luz',
   'Apartamento Luz',
   'El Vedado, Havana',
   '1950s apartment · breeze-block · balcony',
   'A corner apartment in El Vedado where breeze-block, mosaic and a long balcony frame daily life above the street.',
   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop',
   array[
     'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop',
     'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1600&auto=format&fit=crop',
     'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1600&auto=format&fit=crop'
   ],
   '[{"label":"District","value":"El Vedado"},{"label":"Year","value":"1954"},{"label":"Area","value":"128 m²"},{"label":"Type","value":"Corner apartment"},{"label":"Detail","value":"Breeze-block, hydraulic mosaic"}]'::jsonb,
   'Typical Vedado rationalism: a raised ground floor, continuous balcony, and operable screens that negotiate sun and breeze. The corner condition gives dual aspect — morning light in the kitchen, evening light in the salon.',
   'Hydraulic mosaic retained throughout; kitchen rebuilt in oiled timber and honed stone. Books, plants and a single long table carry the domestic rhythm.',
   'Lived in continuously since 1956, the flat preserves layers of wallpaper, paint and repair. The current custodians chose to edit, not erase.',
   'published', now()),
  ('casa-colon-patio',
   'Casa Colón Patio',
   'Centro Habana, Havana',
   'Colonial patio house · lime · timber',
   'A colonial patio house in Centro where thick walls, shutters and a single orange tree order the day.',
   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
   array[
     'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
     'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1600&auto=format&fit=crop',
     'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop'
   ],
   '[{"label":"District","value":"Centro Habana"},{"label":"Year","value":"c. 1890"},{"label":"Area","value":"210 m²"},{"label":"Type","value":"Patio house"},{"label":"Materials","value":"Lime, timber, encaustic tile"}]'::jsonb,
   'Load-bearing masonry, high ceilings and a central patio that acts as lung and lamp. Rooms open directly to the gallery; shutters modulate light to a soft, workable glow.',
   'Sparse, tactile rooms. Lime plaster left matte, timber darkened by time, tile patterns unrepeated. Imperfection is kept as texture.',
   'Once subdivided, now reunified. Traces of partition walls remain as faint lines — a gentle history of density and return.',
   'published', now())
on conflict (slug) do update set
  name = excluded.name, location = excluded.location,
  character = excluded.character, description = excluded.description,
  cover = excluded.cover, images = excluded.images, facts = excluded.facts,
  architecture = excluded.architecture, interior = excluded.interior,
  story = excluded.story, status = excluded.status,
  published_at = excluded.published_at;

-- ── Journal ──
insert into journal_posts
  (slug, title, category, excerpt, image, date_label, reading_time, status, published_at)
values
  ('light-in-vedado',
   'Light in El Vedado: how shutters shape a room',
   'Interiors',
   'Morning in Vedado is measured in slats — a study of how timber screens soften the tropical sun into inhabitable calm.',
   'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
   'No. 04 — September 2026', '6 min', 'published', now()),
  ('terrazzo-memory',
   'Terrazzo as memory: floors that remember Havana',
   'Materials',
   'Poured, ground and polished in place — terrazzo carries aggregate, labour and time in a single surface.',
   'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop',
   'No. 03 — August 2026', '5 min', 'published', now()),
  ('patio-houses',
   'The patio house endures',
   'Architecture',
   'Two centuries on, the patio remains Havana''s most intelligent room — climate, privacy and community at once.',
   'https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=1200&auto=format&fit=crop',
   'No. 02 — July 2026', '8 min', 'published', now()),
  ('people-who-restore',
   'The people who restore, quietly',
   'People',
   'Carpenters, masons and ironworkers keeping tacit knowledge alive — portraits from three workshops in Centro.',
   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop',
   'No. 01 — June 2026', '7 min', 'published', now())
on conflict (slug) do update set
  title = excluded.title, category = excluded.category,
  excerpt = excluded.excerpt, image = excluded.image,
  date_label = excluded.date_label, reading_time = excluded.reading_time,
  status = excluded.status, published_at = excluded.published_at;
