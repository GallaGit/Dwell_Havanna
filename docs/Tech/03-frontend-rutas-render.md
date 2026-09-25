# 03 — Frontend: rutas y render

Fuente: `app/**/page.tsx`, `app/**/route.ts`, `components/*.tsx`.

Los flujos editoriales y las decisiones de permisos están en `docs/PRODUCT/05-flujos-editoriales.md` y `docs/PRODUCT/roadmap.md`.

## Tabla de rutas

`npm run build` (Next.js 16.3.5, 2026-09-25, con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de ejemplo) prerenderiza el contenido público. Cada slug SSG cuenta. No cuentan `/_not-found` ni las etiquetas de grupo. La cifra anterior de 19 paths es de antes de iconos, `robots.txt`, manifiesto y los slugs de `/embed`.

| Ruta | Archivo | Tipo / render |
|---|---|---|
| `/` | `app/page.tsx` | Estática, `revalidate 3600`. No lee cookies |
| `/about` (+ `#contact`) | `app/about/page.tsx` | Estática. El email sale de `NEXT_PUBLIC_CONTACT_EMAIL` |
| `/properties` | `app/properties/page.tsx` + `PropertyFilters.tsx` | ISR 1h + filtro client-side por ciudad. Tarjetas en `h2` |
| `/properties/[slug]` ×3 | `app/properties/[slug]/page.tsx` | SSG+ISR, metadata con imagen del optimizador |
| `/journal` | `app/journal/page.tsx` + `JournalIndex.tsx` | ISR 1h. Filtro de temas en cliente. Tarjetas en `h2` |
| `/journal/[slug]` ×4 | `app/journal/[slug]/page.tsx` | SSG+ISR. OG usa `/_next/image?w=1200&q=70` |
| `/contribuir` | `app/contribuir/page.tsx` | Estática de shell, `"use client"`. `noindex` |
| `/iniciar-sesion` | `app/iniciar-sesion/page.tsx` | Estática de shell, `"use client"`. `next` pasa por `lib/safe-redirect.ts`. `noindex` |
| `/auth/callback` | `app/auth/callback/route.ts` | Dinámica. `code` (PKCE) o `token_hash` + `type` |
| `/admin/review` | `app/admin/review/page.tsx` + `ModerationDecision.tsx` | Dinámica. `noindex`. El layout admin pone `lang="es"` |
| `/api/submissions` | `app/api/submissions/route.ts` | `POST` dinámico, `runtime nodejs` |
| `/feed.xml` | `app/feed.xml/route.ts` | ISR 1h. La imagen es la URL del optimizador |
| `/sitemap.xml` | `app/sitemap.ts` | ISR 1h |
| `/robots.txt` | `app/robots.ts` | Estática. Permite `/` y niega `/admin/`, `/api/` y `/auth/` |
| `/manifest.webmanifest` | `app/manifest.ts` | Estática. Iconos provisionales |
| `/icon.png`, `/apple-icon.png` | `app/icon.png`, `app/apple-icon.png` | Estáticas. Monograma provisional |
| `/embed/[slug]` ×7 | `app/embed/[slug]/route.ts` | SSG+ISR. `frame-ancestors *`. `Cache-Control` público de 1h |

Slugs iniciales: `casa-miramar-1938`, `apartamento-vedado-luz`, `casa-colon-patio` / `light-in-vedado`, `terrazzo-memory`, `patio-houses`, `people-who-restore`.

## Home (`app/page.tsx`)

Orden revista (igual que `Design-Direction.md` §Homepage): featured → journal (`01`) → featured homes (`02`) → patio/architecture (`03`) → Havana (`04`) → about (`05`). Max `1400px`, grid 12 col. La foto principal usa `preload` y no lleva la clase `.reveal`: la opacidad 0 de esa animación retrasaba el LCP. El texto de la portada sí usa `.reveal`.

La portada no llama a `cookies()`. El enlace de contribuir (`components/ContributeLink.tsx`) lee la cookie de Auth en el cliente con `useSyncExternalStore`. En el HTML estático el texto es el de quien no ha iniciado sesión. La autorización sigue en `/contribuir` y en `POST /api/submissions`.

La foto de la sección de arquitectura es la del post que no está ya en la columna lateral, para no pedir el mismo JPEG dos veces.

## Detalles

- Property (`app/properties/[slug]/page.tsx`): hero → título/location/intro → galería `images.slice(1)` → architecture/interior/story → facts `<dl>` → CTA `/about#contact` → prev/next.
- Journal (`app/journal/[slug]/page.tsx`): kicker categoría/fecha/lectura → título → excerpt → hero 16/9 → cuerpo. Hoy el cuerpo es `journalPlaceholderParagraphs` (`lib/placeholders.ts`).
- Índices: `/properties` filtra por ciudad (`All/Miramar/Vedado/Centro`) en el cliente. `/journal` filtra por tema con la misma idea. No hay búsqueda libre por texto.
- Encabezados: un `h1` por página. En la portada las tarjetas son `h3` bajo el `h2` de `SectionHeading`. En `/journal` y `/properties` las tarjetas son `h2`, porque encima solo está el `h1`.
- `id="contact"` vive solo en `/about`. El footer ya no lo repite. El header y el CTA de una property enlazan a `/about#contact`.
- `sizes` de las tarjetas en `components/Editorial.tsx` sigue el ancho real de la columna (journal hasta unos 440px, property hasta unos 700px). El hero de un post usa el ancho del contenido, no `100vw`, salvo el hero a sangre de una property.

## Componentes (`components/`)

- `Editorial.tsx`: `SectionHeading({index,label,title,href})`, `PropertyEntry({property, sizes, heading})`, `JournalEntry({post, sizes, heading})`.
- `SiteHeader.tsx`: sticky, `bg-paper/95 backdrop-blur`, nav Journal/Properties/About + `Enquire → /about#contact`; en móvil muestra un botón circular fijo de 56px con iconos SVG `Menu` y `X`. El botón queda a 24px de los bordes del viewport, con soporte para `safe-area-inset`, y despliega la misma navegación hacia la izquierda en 0.8s. El panel mantiene 24px de margen izquierdo, 16px de separación respecto al botón y desplazamiento horizontal interno en pantallas estrechas. La posición usa `--mobile-nav-side` y `--mobile-nav-bottom`.
- `SiteFooter.tsx`: manifiesto, índice, categorías journal, contacto. El `mailto` usa `contactEmail`. `© 2026 Editorial prototype / Not a catalogue. A magazine.`
- Las imágenes usan la misma escala editorial en `hover`, `focus-within` y `active`, con reducción automática para `prefers-reduced-motion`.
