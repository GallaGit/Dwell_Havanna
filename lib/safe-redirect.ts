/** Destino si `next` falta o no es un path del mismo origen. */
export const DEFAULT_AUTH_REDIRECT_PATH = "/contribuir";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const ENCODED_SLASH_OR_BACKSLASH = /%(?:2f|5c)/i;

/**
 * Devuelve un path relativo del mismo origen (`/…`), o el fallback.
 * Rechaza `//`, `/\`, esquemas, barras invertidas y encodings que, al
 * resolverse, cambian el origen.
 */
export function safeRedirectPath(
  candidate: string | null | undefined,
  siteOrigin: string,
  fallback: string = DEFAULT_AUTH_REDIRECT_PATH,
): string {
  const origin = parseHttpOrigin(siteOrigin);
  if (!origin) return fallback;

  const safe = toSameOriginPath(candidate, origin);
  if (safe) return safe;

  const fallbackPath = toSameOriginPath(fallback, origin);
  return fallbackPath ?? "/";
}

function parseHttpOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function toSameOriginPath(candidate: string | null | undefined, origin: string): string | null {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  if (!isSingleSlashPath(trimmed)) return null;

  const decoded = decodeRepeatedly(trimmed);
  if (!decoded || !isSingleSlashPath(decoded)) return null;

  let resolved: URL;
  try {
    resolved = new URL(decoded, origin);
  } catch {
    return null;
  }
  if (!isSameOriginPath(resolved, origin)) return null;

  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  let confirmed: URL;
  try {
    confirmed = new URL(path, origin);
  } catch {
    return null;
  }
  if (!isSameOriginPath(confirmed, origin)) return null;
  return `${confirmed.pathname}${confirmed.search}${confirmed.hash}`;
}

function isSameOriginPath(url: URL, origin: string): boolean {
  return (
    url.origin === origin &&
    url.username === "" &&
    url.password === "" &&
    isSingleSlashPath(url.pathname)
  );
}

function isSingleSlashPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  if (value.includes("\\")) return false;
  if (value.includes("://")) return false;
  if (CONTROL_CHARS.test(value)) return false;
  if (SCHEME.test(value)) return false;
  return true;
}

function decodeRepeatedly(value: string): string | null {
  let current = value;
  for (let i = 0; i < 8; i += 1) {
    if (!/%[0-9a-fA-F]{2}/.test(current)) return current;
    try {
      const next = decodeURIComponent(current);
      if (next === current) return current;
      current = next;
    } catch {
      return null;
    }
  }
  if (ENCODED_SLASH_OR_BACKSLASH.test(current)) return null;
  return current;
}
