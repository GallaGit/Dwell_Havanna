/**
 * URL canónica del sitio.
 * Configurar NEXT_PUBLIC_SITE_URL en producción (ej. https://dwellhavana.com).
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dwellhavana.com"
).replace(/\/$/, "");

export function canonicalFor(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
