import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client (service_role).
 * Solo importar desde Server Components / Route Handlers — nunca desde cliente.
 * Devuelve null si faltan las env vars: la capa de contenido (lib/content.ts)
 * cae entonces al dataset estático de lib/data.ts para no romper el build.
 */
/** Tag de las lecturas públicas. `updateTag` la usa al aprobar un envío. */
export const PUBLISHED_CONTENT_TAG = "published-content";

let cached: SupabaseClient | null | undefined;

/**
 * Cliente de lecturas públicas. La respuesta se revalida cada hora, igual
 * que el ISR de las páginas. El cliente de abajo (`getServiceClient`) sigue
 * en `no-store` para la cola de moderación y las mutaciones.
 */
let publishedCached: SupabaseClient | null | undefined;

export function getPublishedContentClient(): SupabaseClient | null {
  if (publishedCached !== undefined) return publishedCached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    publishedCached = null;
    return publishedCached;
  }

  publishedCached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: 3600, tags: [PUBLISHED_CONTENT_TAG] },
        }),
    },
  });
  return publishedCached;
}

export function getServiceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    cached = null;
    return cached;
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return cached;
}
