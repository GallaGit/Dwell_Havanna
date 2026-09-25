import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const EMAIL_OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

type AuthEmailOtpType = (typeof EMAIL_OTP_TYPES)[number];

function isAuthEmailOtpType(value: string): value is AuthEmailOtpType {
  return EMAIL_OTP_TYPES.some((type) => type === value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const destination = safeRedirectPath(url.searchParams.get("next"), url.origin);
  const supabase = await getSupabaseServerClient();
  let signedIn = false;

  // PKCE (`signInWithOtp` en el mismo navegador) llega con `code`.
  // Invitaciones y magic links con plantilla SSR llegan con `token_hash` + `type`.
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    signedIn = !error;
  } else if (supabase && tokenHash && type && isAuthEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    signedIn = !error;
  }

  const destinationUrl = new URL(destination, url.origin);
  if (signedIn) destinationUrl.searchParams.set("welcome", "1");
  return NextResponse.redirect(destinationUrl);
}
