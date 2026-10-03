import {
  DEFAULT_SITE_URL,
  LOCAL_INVITE_ORIGIN,
  resolveInviteOrigin,
  resolveSiteUrl,
  siteUrl,
} from "./site-url.mjs";

/**
 * URL canónica del sitio.
 * En Vercel, NEXT_PUBLIC_SITE_URL es https://dwell-havanna.vercel.app.
 * dwellhavana.com es el dominio siguiente y todavía no está conectado.
 * Un valor vacío, solo espacios o que no sea una URL http(s) absoluta
 * usa la web pública: `new URL("")` rompe el build.
 */

export {
  DEFAULT_SITE_URL,
  LOCAL_INVITE_ORIGIN,
  resolveInviteOrigin,
  resolveSiteUrl,
  siteUrl,
};

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
