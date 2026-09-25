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

Copia `.env.example` a `.env.local`. No commitees secretos. El email de contacto es `NEXT_PUBLIC_CONTACT_EMAIL`. Si falta, el sitio muestra `hola@dwellhavana.example`.

Las páginas públicas se prerenderizan (estáticas o ISR de una hora). El login, `/admin/review`, `POST /api/submissions` y `/auth/callback` siguen dinámicos.

Para listar el SQL canónico sin aplicarlo:

```bash
scripts/apply-canonical-sql.sh
```

## Documentación

La documentación canónica está en [`docs/README.md`](docs/README.md). El trabajo de código previo al despliegue está en [`docs/Tech/07-rendimiento.md`](docs/Tech/07-rendimiento.md) y en [`docs/PRODUCT/contenido-placeholder.md`](docs/PRODUCT/contenido-placeholder.md). Lo que queda fuera del repositorio es el Paso 2 de [`docs/PRODUCT/roadmap.md`](docs/PRODUCT/roadmap.md).
