/**
 * URL canónica del sitio.
 * Configurar NEXT_PUBLIC_SITE_URL en producción (ej. https://dwellhavana.com).
 * Un valor vacío, solo espacios o que no sea una URL http(s) absoluta
 * usa el dominio por defecto: `new URL("")` rompe el build.
 */
import {
  DEFAULT_SITE_URL,
  resolveSiteUrl,
  siteUrl,
} from "./site-url.mjs";

export { DEFAULT_SITE_URL, resolveSiteUrl, siteUrl };

export const siteName = "Dwell Havana";

export const siteDescription =
  "Dwell Havana is an editorial guide to Havana's architecture, design and distinctive homes. Photography first, magazine not catalogue.";

export const siteTitle =
  "Dwell Havana — An editorial guide to Havana's architecture and distinctive homes";

/** Imagen social provisional. Ver public/og-placeholder.png. */
export const placeholderSocialImage = "/og-placeholder.png";

export function canonicalFor(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
