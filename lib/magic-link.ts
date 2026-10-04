import { safeRedirectPath } from "./safe-redirect";

export const MAGIC_LINK_INBOX_MESSAGE =
  "Check your inbox and spam folder. The sign-in link can only be used once. If it expires, request a new one here.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MagicLinkBody = {
  ok: boolean;
  message: string;
  error?: "email_required" | "email_invalid" | "auth_not_configured";
};

/**
 * El texto de bandeja es el mismo si el email está invitado o no.
 * Un 400 solo distingue un email mal formado, que no revela cuentas.
 * La falta de configuración tampoco depende del email.
 */
export function magicLinkHttpResult(input: {
  email: string;
  configured: boolean;
}): { status: number; body: MagicLinkBody } {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Enter your email address.",
        error: "email_required",
      },
    };
  }
  if (!EMAIL_RE.test(email)) {
    return {
      status: 400,
      body: {
        ok: false,
        message: "Enter a valid email address, for example name@example.com.",
        error: "email_invalid",
      },
    };
  }
  if (!input.configured) {
    return {
      status: 503,
      body: {
        ok: false,
        message: "Access is not configured yet.",
        error: "auth_not_configured",
      },
    };
  }
  return { status: 200, body: { ok: true, message: MAGIC_LINK_INBOX_MESSAGE } };
}

export function normalizeMagicLinkEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** `shouldCreateUser: false` se fija en el servidor. El navegador no elige el alta. */
export function magicLinkOtpOptions(origin: string, requestedNext: string | null): {
  emailRedirectTo: string;
  shouldCreateUser: false;
} {
  const next = safeRedirectPath(requestedNext, origin);
  return {
    emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    shouldCreateUser: false,
  };
}
