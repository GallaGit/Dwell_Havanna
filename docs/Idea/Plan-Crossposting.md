# Plan Crossposting — Idea 1 (Aprobado)

> **ESTADO 2026-09-15: Fase 1 IMPLEMENTADA** (commits `9c7d391` + `a6fdcbb` en `main`).
> Detalle y pendientes de activación en `Fase-1-Cierre.md`.
>
> **Aprobación vigente (2026-09-24):** `/admin/review` no crea un borrador. Tras la confirmación, aprobar inserta `journal_posts` con `status='published'`. El diagrama de la sección 2 y el §3.3 describen el plan original. El comportamiento actual está en `docs/PRODUCT/05-flujos-editoriales.md`.

> Híbrido bidireccional + curado, a medida en Next.js.
> Colaboradores verificados → moderación editorial → web como canónico → push automático a FB/IG + sindicación pull a sitios terceros relevantes.

Decisiones aprobadas por el usuario (2026-09-15):
- Fuente: integrar híbrido curado (1) + social-first (3) = ingesta por social, distribución desde web.
- Quién: solo colaboradores verificados (no UGC abierto).
- Cómo: a medida en Next.js (no Buffer/Make como solución final).
- Dominios: NO crear satélites. Interpretación correcta: sindicar el contenido de dwellhavana.com hacia los sitios/cuentas más relevantes en redes.

## 1. Estado actual (punto de partida real)

- App en la raíz del repositorio: Next 16.3.5 + React 19 + Tailwind 4. Rutas: `/`, `/properties`, `/properties/[slug]`, `/journal`, `/journal/[slug]`, `/about`.
- Contenido estático en `lib/data.ts`: tipos `Property` y `JournalPost`, arrays `properties` (3), `journalPosts` (4), helpers `getProperty`, `getPost`. Imágenes vía helper `img()` a `images.unsplash.com`.
- Render: `app/page.tsx` (portada revista), `components/Editorial.tsx` (`SectionHeading`, `PropertyEntry`, `JournalEntry`), detalles con `generateStaticParams()`.
- `next.config.ts`: `images.remotePatterns` solo permite `images.unsplash.com` y `picsum.photos`. Habrá que añadir el futuro Storage (Supabase) + CDN de Meta.
- `app/layout.tsx`: metadata global genérica, sin OG por slug, sin RSS, sin sitemap. Es el primer gap para sindicación pull.
- No hay DB, auth, admin, API routes, webhooks ni app Meta.

Principio editorial inviolable (de `docs/Dwell-Havana_Design-Direction/Design-Direction.md`): fotografía primero, narrativa antes que CTA comercial. La automatización nunca publica directo sin aprobación humana.

## 2. Arquitectura objetivo

```
[Colaborador verificado]
  Authors allowlist
  |  a) formulario /contribuir (fallback Cuba, recomendado primero)
  |  b) DM / mención / #DwellHavana en IG/FB (Fase 3)
  v
POST /api/submissions  →  tabla submissions (status=pending)
  v
/admin/review (solo editora) → approve → draft Property/JournalPost
  v publish
Web canónica (/properties/[slug], /journal/[slug])
  |__ Push: POST /api/syndicate → FB Page + IG Profesional (Fase 2)
  |__ Pull: OG + /feed.xml + sitemap.xml + embeds con UTM (Fase 1)
  |__ Partners: collab posts + repost con atribución (manual curado)
```

## 3. Fase 1 — Fundación web (hacer ahora, sin Meta API todavía)

Objetivo: la web puede recibir, moderar y sindicar. Sin esto, automatizar es frágil.

### 3.1 DB + Storage (Supabase recomendado para Next)

Tablas mínimas (Postgres):

```sql
-- espejo 1:1 de lib/data.ts + workflow
create table properties (
  slug text primary key,
  name text not null, location text not null, character text not null,
  description text not null, cover text not null, images text[] not null default '{}',
  facts jsonb not null default '[]', architecture text not null,
  interior text not null, story text not null,
  status text not null default 'draft' check (status in ('draft','review','published')),
  created_at timestamptz default now(), published_at timestamptz
);
create table journal_posts (
  slug text primary key, title text not null, category text not null,
  excerpt text not null, image text not null,
  date_label text not null, reading_time text not null,
  body_mdx text not null default '',
  status text not null default 'draft' check (status in ('draft','review','published')),
  created_at timestamptz default now(), published_at timestamptz
);
create table verified_contributors (
  handle text primary key, -- ej. '@arq.habana'
  display_name text, source text check (source in ('ig','fb','direct')),
  added_at timestamptz default now()
);
create table submissions (
  id uuid primary key default gen_random_uuid(),
  author_handle text references verified_contributors(handle),
  image_url text not null, caption_raw text not null,
  source text not null check (source in ('form','ig','fb')),
  external_id text, -- id del DM/post origen si viene de Meta
  rights_granted boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);
create table syndications (
  id uuid primary key default gen_random_uuid(),
  post_type text not null check (post_type in ('property','journal')),
  post_slug text not null, target text not null, -- 'fb','ig','partner:archihabana'
  external_id text, external_url text,
  status text not null default 'queued' check (status in ('queued','published','failed')),
  error text, published_at timestamptz, created_at timestamptz default now()
);
```

Storage: bucket `dwell-media` público-lectura. Añadir su hostname a `next.config.ts → images.remotePatterns`. Regla: solo JPEG ≤ 8MB, ratio 4:5 (IG retrato) + 16:9 (web hero) generados al subir.

### 3.2 Capa de datos en Next (migración sin romper UI)

- `lib/db.ts`: cliente Supabase server-side (service role solo en server).
- `lib/content.ts`: `listPublishedProperties()`, `getPropertyBySlug()`, `listPublishedPosts()`, `getPostBySlug()` con misma firma que hoy para que `page.tsx`, `[slug]/page.tsx` y `Editorial.tsx` no cambien de props.
- Script `scripts/migrate-static-to-db.ts`: lee `lib/data.ts` e inserta los 3 properties + 4 posts con `status='published'`. Mantener `data.ts` como fallback/seed hasta verificar.
- Cambiar `generateStaticParams()` a leer de DB + `revalidate = 3600` (ISR) en vez de estático puro.

### 3.3 Rutas nuevas Fase 1

- `GET /contribuir` (formulario ligero, mobile-first, funciona con 3G Cuba): nombre/handle (validado contra `verified_contributors`), foto, título, texto, checkbox obligatorio `rights_granted` ("cedo a Dwell Havana derecho de publicación con crédito"). `POST /api/submissions` guarda + sube imagen a Storage.
- `/admin/review`: lista `submissions pending` con preview, botones aprobar / rechazar. El plan original creaba un draft en `properties` o `journal_posts`. El código actual, tras la confirmación, inserta solo un post de comunidad con `status='published'`. No crea properties desde la cola. El acceso es una cuenta `owner` o `moderator`. `ADMIN_TOKEN` y la cookie httpOnly quedan como fallback temporal.
- `GET /feed.xml` (RSS de journal + properties), `GET /sitemap.xml`, `GET /embed/[slug]` (iframe claro para terceros).
- `generateMetadata()` por slug en `properties/[slug]/page.tsx` y `journal/[slug]/page.tsx`: `title`, `description`, `openGraph.images[0]=cover`, `alternates.canonical=https://dwellhavana.com/...`. Hoy solo hay metadata global en `layout.tsx`.

### 3.4 Plantillas de caption (para que Fase 2 sea copiar-pegar)

- FB (largo + link): `{name} — {location}\n{description}\n{story_1frase}\nLee + fotos: {canonical}?utm_source=facebook`
- IG (corta + hashtags): `{name} · {character}\n{description_125car}\n📍 {location}\n#DwellHavana #ArquitecturaHabana #Interiores #LaHabana` + link en bio/stories (IG no linkea en caption).
- Alt text obligatorio: `alt_text = {name}, {location}, {character}` (accesibilidad + API lo soporta desde 2025).

### 3.5 Criterios de aceptación Fase 1

1. `npm run build` pasa; home + 3 properties + 4 journal renderizan desde DB.
2. Colaborador NO verificado no puede enviar (rechazo 403 con mensaje claro).
3. Envío sin `rights_granted=true` se rechaza.
4. Cada slug tiene OG válido (verificado con validator de Meta) + canonical propio.
5. `/feed.xml` y `/sitemap.xml` responden 200.
6. `/admin/review` inaccesible sin token.

## 4. Checklist App Meta (preparar en paralelo, implementar en Fase 2)

No requiere código aún, pero bloquea todo lo automático. Responsable: dueña de cuentas.

- [ ] Convertir IG a **Profesional (Business/Creator)**. Personal no tiene API.
- [ ] Crear / designar **Facebook Page** (ej. Dwell Havana) y vincularla al IG en Accounts Center. Verificar que el vínculo está "healthy".
- [ ] Usuario admin con **2FA activada** y rol con tareas `MANAGE` o `CREATE_CONTENT` en la Page.
- [ ] Completar **Page Publishing Authorization (PPA)** preventivamente (si la Page lo exige después, la API falla sin aviso previo).
- [ ] Crear App en developers.facebook.com → añadir productos **Instagram Graph API + Facebook Login for Business**.
- [ ] Permisos a solicitar: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement` (+ `ads_management` o `ads_read` si el rol viene vía Business Manager).
- [ ] Pasar App Review a **Advanced Access** para esos permisos. En modo dev solo funciona con usuarios test.
- [ ] Generar **Page access token de larga duración** (~60 días) + job de refresco. Guardar en secrets, nunca en cliente.
- [ ] Preparar host público de imágenes (el bucket Supabase del §3.1): Meta hace cURL a `image_url` en el momento de crear el container. URL firmada corta o privada = error.
- [ ] Validar límites: JPEG solo, 1 container expira en 24h si no se publica, tope ~50-100 `media_publish`/24h. Para Dwell Havana (2-3 posts/semana) sobra.
- [ ] Secuencia API a implementar en Fase 2: `POST /{ig-id}/media?image_url=&caption=&alt_text=` → poll `GET /{container-id}?fields=status_code` hasta `FINISHED` → `POST /{ig-id}/media_publish?creation_id=` → guardar `external_id` en `syndications`. FB Page post similar vía `/{page-id}/feed` o `/photos`.

## 5. Fases 2 y 3 (no hacer aún, solo alcance)

- **Fase 2 — auto-push:** `POST /api/syndicate {post_type, slug, targets:['ig','fb']}` con cola + reintentos, preview FB vs IG lado a lado en admin, campo caption editable por red antes de enviar. Tabla `syndications` como log auditable.
- **Fase 3 — auto-ingesta:** `GET/POST /api/webhooks/meta` (verificación `hub.challenge` + recepción eventos), allowlist estricta `verified_contributors`, deduplicación por `external_id`. Si webhook es inestable en Cuba, fallback a polling cada 15 min + formulario.

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación en este plan |
|---|---|
| Spam / baja calidad rompe marca editorial | Allowlist + moderación humana obligatoria; API nunca publica directo |
| Token Meta expira / PPA bloquea | Formulario web siempre funciona; job refresco + alerta email |
| Derechos de foto | `rights_granted` NOT NULL + handle + fecha; sin esto no hay publish |
| SEO duplicado con partners | Canonical en web, a terceros solo extracto + link UTM, embed con atribución |
| Coste a medida vs no-code | Fase 1 ya aporta valor (CMS + SEO) aunque Fase 2 se retrase |

## 7. Orden de ejecución sugerido

1. DB + Storage + `next.config.ts` hosts.
2. `lib/content.ts` + migración static→DB + ISR.
3. `generateMetadata` OG/canonical + feed + sitemap + embed.
4. `/contribuir` + `/api/submissions` + allowlist.
5. `/admin/review` + `ADMIN_TOKEN`.
6. Checklist Meta (§4) en paralelo por la dueña.
7. Recién entonces Fase 2 (syndicate).

Estimación orientativa: Fase 1 = 4-6 días dev + 1 día revisión editorial; checklist Meta = 3-7 días hábiles (depende de App Review).
