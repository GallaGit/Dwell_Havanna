/**
 * Timeout de fetch para los clientes de Supabase.
 *
 * Las lecturas usan ~5s (`SUPABASE_FETCH_TIMEOUT_MS`). `supabase-js` reintenta
 * los fallos de red que no son `AbortError` (hasta 3 veces, con 1s/2s/4s).
 * `AbortSignal.timeout` rechaza con `TimeoutError`, y ese reintento convertiría
 * un tope de 5s en unos 27s. Si el que vence es el timeout, devolvemos
 * `AbortError` para que el tope sea el de esta llamada. La señal del caller
 * se conserva tal cual.
 */

export const DEFAULT_SUPABASE_FETCH_TIMEOUT_MS = 5_000;
export const STORAGE_UPLOAD_TIMEOUT_MS = 60_000;
export const AUTH_OTP_TIMEOUT_MS = 20_000;

const TIMEOUT_ENV = "SUPABASE_FETCH_TIMEOUT_MS";

const STORAGE_NON_UPLOAD =
  /\/storage\/v1\/object\/(?:list-v2|list|sign|info|move|copy|public)(?:\/|$)/;

export function supabaseFetchTimeoutMs(
  env: { [key: string]: string | undefined } = process.env,
): number {
  const raw = env[TIMEOUT_ENV];
  if (typeof raw !== "string" || raw.trim() === "") return DEFAULT_SUPABASE_FETCH_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SUPABASE_FETCH_TIMEOUT_MS;
  return parsed;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) return input.method.toUpperCase();
  return "GET";
}

/** POST/PUT de un objeto de Storage (incluye la subida firmada). No incluye list/sign/move. */
export function isSupabaseStorageUpload(input: RequestInfo | URL, init?: RequestInit): boolean {
  const method = requestMethod(input, init);
  if (method !== "POST" && method !== "PUT") return false;
  let pathname: string;
  try {
    pathname = new URL(requestUrl(input)).pathname;
  } catch {
    return false;
  }
  if (!pathname.includes("/storage/v1/object/")) return false;
  if (STORAGE_NON_UPLOAD.test(pathname)) return false;
  return /\/storage\/v1\/object\/.+/.test(pathname);
}

export function resolveSupabaseRequestTimeoutMs(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  readTimeoutMs: number,
): number {
  if (!isSupabaseStorageUpload(input, init)) return readTimeoutMs;
  return Math.max(readTimeoutMs, STORAGE_UPLOAD_TIMEOUT_MS);
}

function callerSignal(input: RequestInfo | URL, init?: RequestInit): AbortSignal | undefined {
  if (init?.signal) return init.signal;
  if (typeof Request !== "undefined" && input instanceof Request) return input.signal;
  return undefined;
}

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "TimeoutError"
  );
}

function startTimeout(ms: number): { signal: AbortSignal; dispose: () => void } {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return {
      signal: AbortSignal.timeout(ms),
      dispose() {
        // AbortSignal.timeout no se cancela. En Node el timer queda unref.
      },
    };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
  }, ms);
  if (typeof timer === "object" && timer !== null && "unref" in timer && typeof timer.unref === "function") {
    timer.unref();
  }
  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timer);
    },
  };
}

function abortSignalAny(signals: AbortSignal[]): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined" || typeof AbortSignal.any !== "function") return undefined;
  return AbortSignal.any(signals);
}

function mergeWithController(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  const abortFrom = (signal: AbortSignal) => {
    if (!controller.signal.aborted) controller.abort(signal.reason);
  };
  for (const signal of signals) {
    if (signal.aborted) {
      abortFrom(signal);
      return controller.signal;
    }
  }
  for (const signal of signals) {
    signal.addEventListener("abort", () => abortFrom(signal), { once: true });
  }
  return controller.signal;
}

export function createFetchWithTimeout(timeoutMs: number, baseFetch?: typeof fetch): typeof fetch {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("timeoutMs must be a positive finite number");
  }

  return async function fetchWithTimeout(input, init) {
    const doFetch = baseFetch ?? globalThis.fetch;
    const caller = callerSignal(input, init);
    const timeout = startTimeout(timeoutMs);
    const parts = caller ? [caller, timeout.signal] : [timeout.signal];
    const signal = abortSignalAny(parts) ?? mergeWithController(parts);

    try {
      return await doFetch(input, { ...init, signal });
    } catch (error) {
      if (!caller?.aborted && timeout.signal.aborted && isTimeoutError(error)) {
        const message =
          error instanceof Error ? error.message : "The operation was aborted due to timeout";
        throw new DOMException(message, "AbortError");
      }
      throw error;
    } finally {
      timeout.dispose();
    }
  };
}
