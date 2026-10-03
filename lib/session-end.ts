import { hasSupabaseAuthCookie, isSupabaseAuthCookieName } from "./auth-cookie";

/** Cookie del token de emergencia retirado. El cierre de sesión la borra si queda. */
export const LEGACY_ADMIN_COOKIE = "dh_admin";

export function shouldOfferSignOut(
  cookies: ReadonlyArray<{ name: string; value?: string }>,
): boolean {
  if (hasSupabaseAuthCookie(cookies)) return true;
  return cookies.some((cookie) => cookie.name === LEGACY_ADMIN_COOKIE && Boolean(cookie.value));
}

export function cookieNamesToClear(names: readonly string[]): string[] {
  return names.filter(
    (name) => name === LEGACY_ADMIN_COOKIE || isSupabaseAuthCookieName(name),
  );
}

/**
 * Cierra la sesión de Auth y borra las cookies locales aunque Auth no responda.
 * `redirect` queda fuera: lo llama la Server Action.
 */
export async function endSession(deps: {
  signOutAuth: () => Promise<void>;
  cookieNames: readonly string[];
  deleteCookie: (name: string) => void;
}): Promise<void> {
  try {
    await deps.signOutAuth();
  } catch {
    // Auth caído no debe dejar la cookie de sesión en el navegador.
  }
  for (const name of cookieNamesToClear(deps.cookieNames)) {
    deps.deleteCookie(name);
  }
}
