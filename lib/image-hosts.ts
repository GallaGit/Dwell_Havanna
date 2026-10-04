export type RemotePattern = {
  protocol: "https";
  hostname: string;
};

const SUPABASE_SUFFIX = ".supabase.co";

/**
 * Hostname concreto del proyecto. Rechaza `*.supabase.co` y cualquier comodín.
 * El ref sale de `NEXT_PUBLIC_SUPABASE_URL` en el build. Si falta, el
 * optimizador no acepta Storage hasta que la variable esté en el build.
 */
export function supabaseStorageHostname(supabaseUrl: string | undefined): string | null {
  if (!supabaseUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith(SUPABASE_SUFFIX)) return null;
  if (host.includes("*")) return null;
  const ref = host.slice(0, -SUPABASE_SUFFIX.length);
  if (!/^[a-z0-9]{8,40}$/.test(ref)) return null;
  return host;
}

/**
 * Unsplash sigue en el seed y en `lib/placeholders.ts`. Picsum no aparece
 * en el contenido de ejemplo: no entra en el allowlist.
 */
export function imageRemotePatterns(supabaseUrl: string | undefined): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: "https", hostname: "images.unsplash.com" },
  ];
  const host = supabaseStorageHostname(supabaseUrl);
  if (host) patterns.push({ protocol: "https", hostname: host });
  return patterns;
}
