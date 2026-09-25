# Sustituir el contenido de ejemplo

El sitio sale con fotos, textos y un email de prueba. Están marcados como PLACEHOLDER. No son el material definitivo de la revista.

## Dónde está

| Qué | Dónde |
|---|---|
| Fotos de stock, estudios de la portada, los tres párrafos que comparten los posts y el email de prueba | `lib/placeholders.ts` |
| Títulos, excerpts, fichas y datos de properties y journal | `lib/data.ts` |
| El mismo ejemplo, si se carga la base | `supabase/02-seed.sql` |
| Email público en producción | `NEXT_PUBLIC_CONTACT_EMAIL` |
| Imagen social por defecto | `public/og-placeholder.png` |
| Iconos provisionales (monograma DH) | `app/icon.png`, `app/apple-icon.png`, `public/icon-192-placeholder.png`, `public/icon-512-placeholder.png` |

`lib/placeholders.ts` abre con un comentario PLACEHOLDER. El email de prueba es `hola@dwellhavana.example`. Si `NEXT_PUBLIC_CONTACT_EMAIL` no está definida, el sitio usa ese valor. `/about` y el footer leen `contactEmail`.

Los posts, vengan de `lib/data.ts` o de Supabase, usan `journalPlaceholderParagraphs` como cuerpo. La base no guarda todavía un cuerpo por pieza.

## Cómo sustituirlo

1. Define `NEXT_PUBLIC_CONTACT_EMAIL` con el buzón real, en `.env.local` y en las variables de Vercel. El valor tiene que ser un email, sin `mailto:`.
2. Sustituye las fotos. Cada id de `placeholderPhoto` es un path `photo-…` de Unsplash. Cuando la foto definitiva esté en el bucket `dwell-media` o en otro host permitido por `images.remotePatterns` de `next.config.ts`, cambia la URL en `lib/data.ts` (y en el seed, si la base ya tiene esas filas).
3. Escribe el cuerpo de cada post. Cuando exista, deja de asignar `journalPlaceholderParagraphs` en `lib/content.ts` y en `lib/data.ts`.
4. Revisa títulos, excerpts, categorías, fechas y textos `alt` en `lib/data.ts`. Si la base ya tiene el seed, actualiza esas filas. No hace falta inventar texto nuevo en el código para salir: el seed es el espejo SQL del ejemplo.
5. Sustituye `public/og-placeholder.png` (1200×630) y los cuatro iconos. `app/icon.png` es 32×32 y `app/apple-icon.png` es 180×180. Los de `public/icon-*-placeholder.png` los declara `app/manifest.ts`.
6. Vuelve a generar el sitio (`npm run build`) para que Open Graph, el sitemap y el feed tomen las URLs nuevas.

Las páginas públicas siguen en ISR de una hora. Tras publicar en el panel, la aprobación llama a `updateTag("published-content")` y a `revalidatePath` de `/`, `/journal`, el slug nuevo, `/feed.xml` y `/sitemap.xml`.

Los iconos y `public/og-placeholder.png` dicen, en el archivo o en el manifiesto, que son provisionales. El monograma DH no es el logotipo de la revista.
