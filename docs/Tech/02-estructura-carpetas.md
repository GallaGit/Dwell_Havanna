# 02 — Estructura de carpetas

Leído con el árbol real de la raíz del repositorio el 2026-09-24.

La documentación de producto está en `docs/PRODUCT/`. Esta página describe la app Next.js en la raíz del repositorio. `docs/` queda fuera de este árbol.

```
.
├── .env.example            # plantilla env (URL, Supabase, ADMIN_TOKEN)
├── .env.local              # local real, gitignoreado (no commitear)
├── .gitignore              # ignora node_modules, .next, .env*, .vercel
├── package.json            # scripts dev/build/start/lint + deps
├── next.config.ts          # images.remotePatterns (unsplash, picsum, *.supabase.co)
├── tsconfig.json           # strict, alias @/*, plugin next
├── postcss.config.mjs      # @tailwindcss/postcss
├── eslint.config.mjs       # next core-web-vitals + typescript
├── next-env.d.ts
├── AGENTS.md / CLAUDE.md   # solo regla agente Next.js
├── README.md               # default create-next-app (ignorar)
├── public/                 # solo SVGs default (file, globe, next, vercel, window)
├── app/
│   ├── layout.tsx          # fonts, metadata global, <SiteHeader/>, <SiteFooter/>
│   ├── page.tsx            # home revista (6 secciones)
│   ├── globals.css         # tokens + helpers editoriales
│   ├── sitemap.ts          # sitemap.xml dinámico
│   ├── about/page.tsx
│   ├── properties/page.tsx + [slug]/page.tsx + PropertyFilters.tsx
│   ├── journal/page.tsx + journal/[slug]/page.tsx
│   ├── contribuir/page.tsx # "use client", formulario ingesta
│   ├── iniciar-sesion/page.tsx # "use client", enlace para cuentas ya invitadas
│   ├── auth/callback/route.ts # cambia el código Auth por sesión
│   ├── admin/review/page.tsx # server actions de acceso, decisión e invitaciones
│   ├── admin/review/ModerationDecision.tsx # confirmación en cliente antes de aprobar o rechazar
│   ├── api/submissions/route.ts # POST multipart ingesta
│   ├── feed.xml/route.ts   # RSS 2.0 + media:content
│   └── embed/[slug]/route.ts # HTML iframe para terceros
├── components/
│   ├── Editorial.tsx       # SectionHeading, PropertyEntry, JournalEntry
│   ├── SiteHeader.tsx      # "use client", nav sticky y menú móvil
│   └── SiteFooter.tsx      # manifiesto + índice + contacto
├── lib/
│   ├── data.ts             # fallback estático: 3 properties + 4 posts
│   ├── content.ts          # capa contenido: lee Supabase o cae a data.ts
│   ├── db.ts               # getServiceClient() service_role o null
│   ├── site.ts             # siteUrl + canonicalFor(path)
│   ├── editorial-auth.ts   # sesión editorial o fallback ADMIN_TOKEN
│   ├── editorial-permissions.ts # owner, moderator y fallback
│   ├── supabase-server.ts  # cliente Auth en el servidor
│   └── supabase-browser.ts # cliente Auth en el navegador
└── supabase/
    ├── 01-schema.sql       # 5 tablas + RLS + bucket dwell-media
    ├── 02-seed.sql         # seed idempotente desde data.ts
    ├── 03-contributor-auth.sql
    ├── 04-editorial-permissions.sql
    └── migrations/         # 20260921000100, 20260921000200, 20260921000300
```

## Rol por archivo clave

| Path | Rol |
|---|---|
| `app/layout.tsx` | Shell global: `<html lang="en">`, header/main/footer, metadata base |
| `app/page.tsx` | Portada: featured + journal + homes + patio + Havana + about |
| `app/sitemap.ts` | Sitemap dinámico desde `listPublished*()` |
| `app/feed.xml/route.ts` | RSS journal+properties |
| `app/embed/[slug]/route.ts` | Embed terceros (resuelve property o post, 404 si no) |
| `app/api/submissions/route.ts` | Ingesta validada (JPEG ≤8MB, allowlist, Storage) |
| `app/contribuir/page.tsx` | Client Component: `fetch` + estados idle/sending/done/error |
| `app/iniciar-sesion/page.tsx` | Client Component: enlace OTP para emails ya invitados |
| `app/admin/review/page.tsx` | Moderación, invitaciones y gestión de miembros con Server Actions |
| `app/admin/review/ModerationDecision.tsx` | Diálogo de confirmación antes de aprobar o rechazar |
| `lib/site.ts` | Canónica: `NEXT_PUBLIC_SITE_URL` o `https://dwellhavana.com` |
| `lib/db.ts` | Cliente server-only, cacheado, `null` si faltan envs |
| `lib/content.ts` | Misma forma que `data.ts` para no romper páginas |
| `supabase/*.sql` | Referencias legibles. El orden formal está en `supabase/migrations/` |
