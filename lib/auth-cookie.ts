/**
 * Cookie de sesión de Supabase Auth (`sb-<project-ref>-auth-token`,
 * también partida en `….0`, `….1`). No es una prueba de autorización:
 * solo evita llamar a Auth cuando el visitante no trae sesión.
 */
export function isSupabaseAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

export function hasSupabaseAuthCookie(
  cookies: ReadonlyArray<{ name: string; value?: string }>,
): boolean {
  return cookies.some(
    (cookie) => isSupabaseAuthCookieName(cookie.name) && Boolean(cookie.value),
  );
}

export function hasSupabaseAuthCookieInDocument(cookieHeader: string): boolean {
  const cookies = cookieHeader.split(";").flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) return [];
    const separator = trimmed.indexOf("=");
    if (separator === -1) return [{ name: trimmed, value: "" }];
    return [
      {
        name: trimmed.slice(0, separator),
        value: trimmed.slice(separator + 1),
      },
    ];
  });
  return hasSupabaseAuthCookie(cookies);
}
