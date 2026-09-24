# 02 — Estructura de carpetas

Leído con el árbol real de la raíz del repositorio el 2026-09-15.

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
| `app/layout.tsx` | Shell global: `<html lang="en">`, header/main/footer, metadata base |
| `app/page.tsx` | Portada: featured + journal + homes + patio + Havana + about |
| `app/sitemap.ts` | Sitemap dinámico desde `listPublished*()` |
| `app/feed.xml/route.ts` | RSS journal+properties |
| `app/embed/[slug]/route.ts` | Embed terceros (resuelve property o post, 404 si no) |
| `app/api/submissions/route.ts` | Ingesta validada (JPEG ≤8MB, allowlist, Storage) |
| `app/contribuir/page.tsx` | Único Client Component: `fetch` + estados idle/sending/done/error |
| `app/admin/review/page.tsx` | Moderación con Server Actions |
| `lib/site.ts` | Canónica: `NEXT_PUBLIC_SITE_URL` o `https://dwellhavana.com` |
| `lib/db.ts` | Cliente server-only, cacheado, `null` si faltan envs |
| `lib/content.ts` | Misma forma que `data.ts` para no romper páginas |
| `supabase/*.sql` | Orden de aplicación: `01` luego `02` en SQL Editor |
