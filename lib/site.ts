/**
 * URL canónica del sitio.
 * Configurar NEXT_PUBLIC_SITE_URL en producción (ej. https://dwellhavana.com).
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dwellhavana.com"
).replace(/\/$/, "");

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
