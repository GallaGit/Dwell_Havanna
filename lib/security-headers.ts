/**
 * CSP compatible con el ISR de una hora.
 * Un nonce en `script-src` obliga a render dinámico en cada request y
 * apaga el estático (Next.js 16, guía de CSP). Esta revista no lo usa.
 * `script-src` queda en `'self'` y `'unsafe-inline'` porque Next inyecta
 * el bootstrap inline. Eso bloquea scripts de otros orígenes, `object-src`
 * y `base-uri`. `'unsafe-eval'` solo entra en desarrollo (React Refresh).
 * No es report-only: la política no rompe el render estático, así que se aplica.
 */

export const HSTS_VALUE = "max-age=63072000; includeSubDomains";
export const COOP_VALUE = "same-origin";

export function contentSecurityPolicy(
  pathname: string,
  options: { dev: boolean; extraImgHosts?: readonly string[] },
): string {
  const scriptSrc = options.dev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  const frameAncestors = pathname.startsWith("/embed")
    ? "frame-ancestors *"
    : "frame-ancestors 'self'";
  const extraImgHosts = (options.extraImgHosts ?? [])
    .map((host) => host.toLowerCase())
    .filter((host) => /^[a-z0-9.-]+$/.test(host));
  const imgSrc = ["'self'", "blob:", "data:", ...extraImgHosts.map((host) => `https://${host}`)].join(" ");
  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    frameAncestors,
  ];
  if (!options.dev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
