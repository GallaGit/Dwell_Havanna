# Dwell Havana

Revista editorial digital sobre arquitectura, interiores, cultura y casas de La Habana. La web es la fuente canónica. Nada se publica sin revisión humana.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 y Supabase (Auth, Postgres y Storage).

## Scripts

```bash
npm run dev      # desarrollo
npm run lint     # eslint
npm test         # node:test; el E2E HTTP se omite sin variables E2E_*
npm run build    # build de producción; no requiere secretos de Supabase
npm run start    # sirve el build
```

Copia `.env.example` a `.env.local`. No commitees secretos.

## Documentación

La documentación canónica está en [`docs/README.md`](docs/README.md). El siguiente paso de producto es el Paso 2 de [`docs/PRODUCT/roadmap.md`](docs/PRODUCT/roadmap.md).
