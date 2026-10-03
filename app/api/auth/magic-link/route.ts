import { AUTH_OTP_TIMEOUT_MS } from "@/lib/fetch-with-timeout";
import {
  magicLinkHttpResult,
  magicLinkOtpOptions,
  normalizeMagicLinkEmail,
} from "@/lib/magic-link";
import {
  MAGIC_LINK_EMAIL_LIMIT,
  MAGIC_LINK_EMAIL_WINDOW_SECONDS,
  MAGIC_LINK_IP_LIMIT,
  MAGIC_LINK_IP_WINDOW_SECONDS,
  clientAddress,
  consumeRateLimit,
  hashRateLimitSubject,
  rateLimitFailure,
  rateLimitKey,
  shouldDispatchMagicLink,
} from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/db";
import { resolveInviteOrigin } from "@/lib/site";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

function readField(payload: unknown, field: string): string {
  if (typeof payload !== "object" || payload === null || !(field in payload)) return "";
  const value = (payload as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

/**
 * POST /api/auth/magic-link
 * El alta queda en el servidor (`shouldCreateUser: false`).
 * Invitado o no, la respuesta de un email válido es el mismo texto.
 * Si el límite no se puede anotar, no se llama a Auth.
 */
export async function POST(req: Request): Promise<Response> {
  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const email = readField(payload, "email");
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const http = magicLinkHttpResult({ email, configured });
  if (http.status !== 200) {
    return Response.json(http.body, { status: http.status });
  }

  const normalized = normalizeMagicLinkEmail(email);
  const db = getServiceClient();
  const decisions = db
    ? await Promise.all([
        consumeRateLimit(
          db,
          rateLimitKey("magic:email", hashRateLimitSubject(normalized)),
          MAGIC_LINK_EMAIL_LIMIT,
          MAGIC_LINK_EMAIL_WINDOW_SECONDS,
        ),
        consumeRateLimit(
          db,
          rateLimitKey(
            "magic:ip",
            hashRateLimitSubject(
              clientAddress(req.headers.get("x-forwarded-for"), req.headers.get("x-real-ip")),
            ),
          ),
          MAGIC_LINK_IP_LIMIT,
          MAGIC_LINK_IP_WINDOW_SECONDS,
        ),
      ])
    : [];
  const failure = rateLimitFailure(decisions);

  if (shouldDispatchMagicLink(failure)) {
    const origin = resolveInviteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
    const supabase = await getSupabaseServerClient(AUTH_OTP_TIMEOUT_MS);
    if (supabase) {
      try {
        await supabase.auth.signInWithOtp({
          email: normalized,
          options: magicLinkOtpOptions(origin, readField(payload, "next") || null),
        });
      } catch {
        // El texto de bandeja no cambia si Auth falla o el email no existe.
      }
    }
  }

  return Response.json(http.body, { status: 200 });
}
