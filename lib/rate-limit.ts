import { createHash } from "node:crypto";

/**
 * Límite de ritmo compartido entre instancias de Vercel.
 * El contador vive en Postgres (`consume_rate_limit`), no en la memoria
 * del proceso: un serverless no comparte RAM entre invocaciones.
 * Si la función no responde, el fallo es cerrado: no se envía el correo
 * ni se acepta la subida. Abrir el límite cuando la base cae dejaría
 * el abuso (enlaces mágicos y JPEGs) sin tope justo en el momento en que
 * no podemos contarlo.
 */

export const SUBMISSION_USER_LIMIT = 8;
export const SUBMISSION_USER_WINDOW_SECONDS = 60 * 60;
export const SUBMISSION_IP_LIMIT = 20;
export const SUBMISSION_IP_WINDOW_SECONDS = 60 * 60;

export const MAGIC_LINK_EMAIL_LIMIT = 5;
export const MAGIC_LINK_EMAIL_WINDOW_SECONDS = 15 * 60;
export const MAGIC_LINK_IP_LIMIT = 20;
export const MAGIC_LINK_IP_WINDOW_SECONDS = 15 * 60;

export const INVITE_ACTOR_LIMIT = 10;
export const INVITE_ACTOR_WINDOW_SECONDS = 60 * 60;

export type RateLimitDecision = "allow" | "deny" | "unavailable";
export type RateLimitFailure = "rate_limited" | "rate_limit_unavailable";

export type RateLimitRpc = {
  rpc: (
    fn: string,
    args: { p_key: string; p_limit: number; p_window_seconds: number },
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

const SUBJECT_HEX = /^[0-9a-f]{32}$/;

export function hashRateLimitSubject(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function rateLimitKey(scope: string, subjectHash: string): string {
  if (!/^[a-z0-9:-]{1,40}$/.test(scope)) {
    throw new Error("invalid rate limit scope");
  }
  if (!SUBJECT_HEX.test(subjectHash)) {
    throw new Error("invalid rate limit subject");
  }
  return `${scope}:${subjectHash}`;
}

/** Primera IP de `x-forwarded-for`, o `x-real-ip`. Si no parece una IP, `unknown`. */
export function clientAddress(forwardedFor: string | null, realIp: string | null): string {
  const first = forwardedFor?.split(",")[0]?.trim() ?? "";
  const candidate = first || realIp?.trim() || "";
  if (candidate.length >= 3 && candidate.length <= 64 && /^[0-9a-fA-F:.]+$/.test(candidate)) {
    return candidate;
  }
  return "unknown";
}

export function interpretRateLimitRpc(result: {
  data: unknown;
  error: unknown;
}): RateLimitDecision {
  if (result.error) return "unavailable";
  if (result.data === true) return "allow";
  if (result.data === false) return "deny";
  return "unavailable";
}

export async function consumeRateLimit(
  db: RateLimitRpc,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitDecision> {
  try {
    const result = await db.rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    return interpretRateLimitRpc(result);
  } catch {
    return "unavailable";
  }
}

/** Cerrado: hace falta un `allow` explícito. `unavailable` no deja pasar. */
export function rateLimitFailure(decisions: readonly RateLimitDecision[]): RateLimitFailure | null {
  if (decisions.length === 0) return "rate_limit_unavailable";
  if (decisions.some((decision) => decision === "unavailable")) return "rate_limit_unavailable";
  if (decisions.some((decision) => decision === "deny")) return "rate_limited";
  if (decisions.every((decision) => decision === "allow")) return null;
  return "rate_limit_unavailable";
}

export function shouldDispatchMagicLink(failure: RateLimitFailure | null): boolean {
  return failure === null;
}
