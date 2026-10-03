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
      // signInWithOtp no usa el timeout corto de lectura: Auth puede tardar
      // más de 5s en enviar el enlace. 20s evita dejar el formulario colgado.
      fetch: createFetchWithTimeout(AUTH_OTP_TIMEOUT_MS),
    },
  });
  return client;
}
