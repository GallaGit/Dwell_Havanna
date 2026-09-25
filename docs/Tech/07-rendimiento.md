# Rendimiento y Lighthouse local

Medición de laboratorio del 2026-09-25. No son datos de campo ni una medición contra `dwellhavana.com`.

## Objetivo

En móvil, contra `next start`:

- Performance ≥ 90
- Accesibilidad ≥ 95

Best practices y SEO se anotan, sin un umbral propio. En móvil, el rendimiento de esta pasada queda entre 93 y 98, y la accesibilidad en 100. Hay que repetir la medición cuando exista la URL pública. El proyecto está subido a Vercel y el despliegue todavía no está verificado (Paso 2 del roadmap).

## Cómo se midió

Lighthouse CLI 13.5.0, Chrome headless, una pasada por URL y formato. El servidor es `npm run build` y `npm run start` en `http://127.0.0.1:3000`. No es `next dev`: ahí el JS no está minificado, Turbopack compila bajo demanda y las cifras de rendimiento no valen.

Móvil usa el preset por defecto de Lighthouse (CPU y red simuladas). Escritorio usa `--preset=desktop`.

URLs: `/`, `/journal` y `/journal/light-in-vedado`.

El «antes» es la rama `cursor/prod-paso-2-prep-a275`, servida sin variables de Supabase. En esa condición la portada ya salía estática, porque el cliente de Auth no llega a `cookies()` si faltan las variables. Con URL y clave públicas, esa portada llamaba a `cookies()` para el texto de un botón y dejaba de ser estática. Esa tabla dinámica no se capturó: el código que leía la cookie se quitó.

El «después» es esta rama, con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SERVICE_ROLE_KEY` de ejemplo. La build sigue marcando `/`, `/journal`, los slugs, `/feed.xml`, `/sitemap.xml` y `/embed/[slug]` como ISR de una hora. La respuesta de `/` trae `Cache-Control: s-maxage=3600, stale-while-revalidate=31532400` y `x-nextjs-cache: HIT`.

## Antes

| Página | Perf. | A11y | BP | SEO | LCP | CLS | TBT | FCP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` escritorio | 99 | 96 | 100 | 100 | 0,8 s | 0 | 0 ms | 0,2 s |
| `/` móvil | 93 | 96 | 100 | 100 | 3,1 s | 0 | 91 ms | 0,8 s |
| `/journal` escritorio | 100 | 94 | 100 | 100 | 0,6 s | 0 | 0 ms | 0,2 s |
| `/journal` móvil | 96 | 94 | 100 | 100 | 2,7 s | 0 | 24 ms | 0,8 s |
| Post escritorio | 100 | 96 | 100 | 100 | 0,6 s | 0 | 0 ms | 0,2 s |
| Post móvil | 97 | 96 | 100 | 100 | 2,7 s | 0 | 24 ms | 0,8 s |

Accesibilidad en rojo: contraste de `#837b6f` sobre `#faf7f2` (3,91:1) en todas las páginas, y orden de encabezados en `/journal` (`h3` sin `h2`).

## Después

| Página | Perf. | A11y | BP | SEO | LCP | CLS | TBT | FCP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` escritorio | 100 | 100 | 100 | 100 | 0,7 s | 0 | 0 ms | 0,2 s |
| `/` móvil | 93 | 100 | 100 | 100 | 3,3 s | 0 | 24 ms | 0,8 s |
| `/journal` escritorio | 100 | 100 | 100 | 100 | 0,6 s | 0 | 0 ms | 0,2 s |
| `/journal` móvil | 98 | 100 | 100 | 100 | 2,5 s | 0 | 25 ms | 0,8 s |
| Post escritorio | 100 | 100 | 100 | 100 | 0,6 s | 0 | 0 ms | 0,2 s |
| Post móvil | 95 | 100 | 100 | 100 | 3,0 s | 0 | 28 ms | 0,8 s |

Las tres URLs en móvil cumplen Performance ≥ 90 y Accesibilidad ≥ 95. Accesibilidad queda en 100. No hay fallos de contraste ni de orden de encabezados.

El LCP móvil de la portada sigue cerca de 3 s. Es la simulación de red lenta de Lighthouse sobre la foto principal, que ahora se descubre en el HTML con `preload` y `fetchpriority=high`, sin la animación `.reveal` (opacidad 0). Una sola pasada no distingue 3,1 s de 3,3 s.

## Qué cambió en el código

- `--color-muted` pasa de `#837b6f` a `#6f685e`: 5,15:1 sobre `#faf7f2` y 4,76:1 sobre `#f3eee6`. Sigue en la familia taupe de la dirección de diseño.
- En `/journal` y `/properties` las tarjetas son `h2`. En la portada siguen en `h3` debajo del `h2` de sección.
- La portada no lee cookies. `proxy.ts` no llama a Auth si no hay cookie `sb-*-auth-token`.
- Las lecturas públicas usan `fetch` con revalidación de una hora. El cliente de la cola sigue en `no-store`.
- `sizes` de las tarjetas sigue el ancho de la columna. OG, RSS y embed usan `/_next/image` a 1200 px y calidad 70. `images.qualities` incluye 70.
- La primera tarjeta de `/journal` y las fotos LCP de portada, post y property llevan `preload` y `fetchPriority="high"`.

Lighthouse sigue avisando de unos 28–29 KiB de JavaScript sin usar en estas páginas (el runtime de Next). No se ha partido más el bundle en esta pasada.
