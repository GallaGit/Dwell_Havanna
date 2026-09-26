/** URL canónica por defecto cuando NEXT_PUBLIC_SITE_URL falta o no es válida. */
export const DEFAULT_SITE_URL = "https://dwellhavana.com";

function warnInvalidSiteUrl(value, warn) {
  const shown = value.length > 120 ? `${value.slice(0, 120)}…` : value;
  warn(
    `NEXT_PUBLIC_SITE_URL no es una URL http(s) válida (${JSON.stringify(shown)}). Se usa ${DEFAULT_SITE_URL}.`,
  );
}

/**
 * `undefined` es el caso local sin variable y no avisa.
 * Una cadena vacía, espacios o una URL que no sea http(s) absoluta sí avisa:
 * en Vercel la variable puede existir y valer "".
 * @param {string | null | undefined} value
 * @param {(message: string) => void} [warn]
 * @returns {string}
 */
export function resolveSiteUrl(value, warn = console.warn) {
  if (value == null) return DEFAULT_SITE_URL;

  const trimmed = value.trim();
  if (!trimmed) {
    warnInvalidSiteUrl(value, warn);
    return DEFAULT_SITE_URL;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    warnInvalidSiteUrl(trimmed, warn);
    return DEFAULT_SITE_URL;
  }

  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.hostname.length === 0
  ) {
    warnInvalidSiteUrl(trimmed, warn);
    return DEFAULT_SITE_URL;
  }

  return trimmed.replace(/\/+$/, "");
}

export const siteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
