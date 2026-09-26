import { siteUrl } from "./site-url.mjs";

/** Ancho permitido por los `deviceSizes` por defecto de next/image. */
export const DELIVERY_IMAGE_WIDTH = 1200;
/** Tiene que estar en `images.qualities` de next.config.ts. */
export const DELIVERY_IMAGE_QUALITY = 70;

/**
 * URL pública ya pasada por el optimizador de Next.
 * OG, RSS y embed no usan next/image: sin esto, un JPEG de hasta 8 MB
 * saldría tal cual desde Storage.
 * El origen es `siteUrl` (`lib/site-url.mjs`, reexportado en `lib/site.ts`).
 */
export function deliveryImageUrl(
  src: string,
  width = DELIVERY_IMAGE_WIDTH,
): string {
  if (!src.startsWith("https://") && !src.startsWith("http://")) return src;
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(DELIVERY_IMAGE_QUALITY),
  });
  return `${siteUrl}/_next/image?${params.toString()}`;
}
