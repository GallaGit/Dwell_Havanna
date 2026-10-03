import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createFetchWithTimeout,
  resolveSupabaseRequestTimeoutMs,
  supabaseFetchTimeoutMs,
} from "./fetch-with-timeout";

/**
 * Clientes de servidor. `server-only` rompe el build si un componente
 * de cliente importa este módulo: aquí está `SUPABASE_SERVICE_ROLE_KEY`.
 * Si faltan las env vars, la capa de contenido cae al dataset estático.
 */
/** Tag de las lecturas públicas. `updateTag` la usa al aprobar un envío. */
export const PUBLISHED_CONTENT_TAG = "published-content";

let cached: SupabaseClient | null | undefined;

/**
 * Lecturas públicas con la clave publishable. La policy `published_read`
 * limita las filas a `status = published`. La respuesta se revalida cada
 * hora, igual que el ISR, y el fetch se aborta si Supabase no responde
 * (`SUPABASE_FETCH_TIMEOUT_MS`, default 5s). `getServiceClient` sigue en
 * `no-store` para la cola y las mutaciones. La subida y la descarga de
 * un objeto de Storage usan un timeout más largo; firmar y borrar siguen
 * en el corto.
 *
 * Si la policy todavía no está aplicada, `lib/content.ts` repite la misma
 * consulta filtrada con `service_role`. Cuando la publishable devuelve
 * filas, esa clave no interviene.
 */
let publishedCached: SupabaseClient | null | undefined;

export function getPublishedContentClient(): SupabaseClient | null {
  if (publishedCached !== undefined) return publishedCached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    publishedCached = null;
    return publishedCached;
  }

  publishedCached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        createFetchWithTimeout(supabaseFetchTimeoutMs())(input, {
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
      fetch: (input, init) => {
        const nextInit = { ...init, cache: "no-store" as const };
        return createFetchWithTimeout(
          resolveSupabaseRequestTimeoutMs(input, nextInit, supabaseFetchTimeoutMs()),
        )(input, nextInit);
      },
    },
  });
  return cached;
}
