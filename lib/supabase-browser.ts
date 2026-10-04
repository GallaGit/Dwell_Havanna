import { createBrowserClient } from "@supabase/ssr";
import { AUTH_OTP_TIMEOUT_MS, createFetchWithTimeout } from "./fetch-with-timeout";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  client = createBrowserClient(url, key, {
    global: {
      // El login ya no usa este cliente: va por /api/auth/magic-link.
      // Si un componente de cliente llama a Auth, 20s evita el corte de 5s.
      fetch: createFetchWithTimeout(AUTH_OTP_TIMEOUT_MS),
    },
  });
  return client;
}
