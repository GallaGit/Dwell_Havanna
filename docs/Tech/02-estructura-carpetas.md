# 02 — Estructura de carpetas

Leído con el árbol real de la raíz del repositorio el 2026-09-25.

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
├── README.md               # qué es el proyecto y dónde está la docs
├── scripts/apply-canonical-sql.sh  # lista o aplica el SQL en orden; dry-run por defecto
├── public/                 # SVGs default + iconos y OG provisionales
├── app/
│   ├── layout.tsx          # fonts, metadataBase, <SiteHeader/>, <SiteFooter/>
│   ├── page.tsx            # home revista (6 secciones)
│   ├── globals.css         # tokens + helpers editoriales
│   ├── robots.ts           # robots.txt
│   ├── manifest.ts         # manifiesto; iconos provisionales
│   ├── icon.png            # 32px, monograma provisional
│   ├── apple-icon.png      # 180px, monograma provisional
│   ├── sitemap.ts          # sitemap.xml, ISR 1h
│   ├── about/page.tsx
│   ├── properties/page.tsx + [slug]/page.tsx + PropertyFilters.tsx
│   ├── journal/page.tsx + JournalIndex.tsx + journal/[slug]/page.tsx
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
│   ├── SiteFooter.tsx      # manifiesto + índice + contacto
│   └── ContributeLink.tsx  # CTA de la portada; lee la cookie de Auth en el cliente
├── lib/
│   ├── data.ts             # fallback estático: 3 properties + 4 posts
│   ├── placeholders.ts     # PLACEHOLDER: fotos, párrafos y email de prueba
│   ├── content.ts          # capa contenido: lee Supabase o cae a data.ts
│   ├── db.ts               # lecturas públicas ISR y servicio no-store
│   ├── site.ts             # siteUrl + canonicalFor(path)
│   ├── page-metadata.ts    # canonical, Open Graph y Twitter por página
│   ├── image-delivery.ts   # URL /_next/image a 1200px y calidad 70
│   ├── auth-cookie.ts      # detecta sb-*-auth-token sin llamar a Auth
│   ├── editorial-auth.ts   # sesión editorial o fallback ADMIN_TOKEN
│   ├── editorial-permissions.ts # owner, moderator y fallback
│   ├── supabase-server.ts  # cliente Auth en el servidor
│   └── supabase-browser.ts # cliente Auth en el navegador
└── supabase/
    ├── 01-schema.sql       # 5 tablas + RLS + bucket dwell-media; auth_user_id en el CREATE TABLE
    ├── 02-seed.sql         # seed idempotente desde lib/data.ts
    ├── 03-contributor-auth.sql
    ├── 04-editorial-permissions.sql  # editorial_members + moderation_events
    ├── migrations/         # 20260921000100, 20260921000200, 20260921000300; sin esquema base
    └── prod-applied/2026-09-25/  # registro del SQL ya aplicado en producción; el CLI no lo lee
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
| `lib/db.ts` | Dos clientes server-only: lecturas públicas con revalidate 3600, y servicio en `no-store` |
| `lib/content.ts` | Misma forma que `data.ts` para no romper páginas |
| `supabase/*.sql` | SQL canónico legible. El orden de aplicación está en `docs/Tech/06-config-operacion.md`. `migrations/` no incluye el esquema base |
| `supabase/prod-applied/2026-09-25/` | Copia de lo ejecutado en producción el 2026-09-25. No es una migración del CLI |
