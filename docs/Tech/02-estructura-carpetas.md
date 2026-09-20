# 02 — Estructura de carpetas (`site/`)

Leído con árbol real de `site/` el 2026-09-15.

La documentación de producto está en `docs/PRODUCT/`. Esta página solo describe la estructura técnica de `site/`.

```
site/
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
│   ├── properties/page.tsx + properties/[slug]/page.tsx
│   ├── journal/page.tsx + journal/[slug]/page.tsx
│   ├── contribuir/page.tsx # "use client", formulario ingesta
│   ├── admin/review/page.tsx # server actions login/decide, cola pending
│   ├── api/submissions/route.ts # POST multipart ingesta
│   ├── feed.xml/route.ts   # RSS 2.0 + media:content
│   └── embed/[slug]/route.ts # HTML iframe para terceros
├── components/
│   ├── Editorial.tsx       # SectionHeading, PropertyEntry, JournalEntry
│   ├── SiteHeader.tsx      # sticky, nav Journal/Properties/About + Enquire
│   └── SiteFooter.tsx      # manifiesto + índice + contacto
├── lib/
│   ├── data.ts             # fallback estático: 3 properties + 4 posts
│   ├── content.ts          # capa contenido: lee Supabase o cae a data.ts
│   ├── db.ts               # getServiceClient() service_role o null
│   └── site.ts             # siteUrl + canonicalFor(path)
└── supabase/
    ├── 01-schema.sql       # 5 tablas + RLS + bucket dwell-media
    └── 02-seed.sql         # seed idempotente desde data.ts
```

## Rol por archivo clave

| Path | Rol |
|---|---|
| `site/app/layout.tsx` | Shell global: `<html lang="en">`, header/main/footer, metadata base |
| `site/app/page.tsx` | Portada: featured + journal + homes + patio + Havana + about |
| `site/app/sitemap.ts` | Sitemap dinámico desde `listPublished*()` |
| `site/app/feed.xml/route.ts` | RSS journal+properties |
| `site/app/embed/[slug]/route.ts` | Embed terceros (resuelve property o post, 404 si no) |
| `site/app/api/submissions/route.ts` | Ingesta validada (JPEG ≤8MB, allowlist, Storage) |
| `site/app/contribuir/page.tsx` | Único Client Component: `fetch` + estados idle/sending/done/error |
| `site/app/admin/review/page.tsx` | Moderación con Server Actions |
| `site/lib/site.ts` | Canónica: `NEXT_PUBLIC_SITE_URL` o `https://dwellhavana.com` |
| `site/lib/db.ts` | Cliente server-only, cacheado, `null` si faltan envs |
| `site/lib/content.ts` | Misma forma que `data.ts` para no romper páginas |
| `site/supabase/*.sql` | Orden de aplicación: `01` luego `02` en SQL Editor |
