import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  AUTH_OTP_TIMEOUT_MS,
  DEFAULT_SUPABASE_FETCH_TIMEOUT_MS,
  STORAGE_UPLOAD_TIMEOUT_MS,
  createFetchWithTimeout,
  isSupabaseStorageUpload,
  resolveSupabaseRequestTimeoutMs,
  supabaseFetchTimeoutMs,
} from "../lib/fetch-with-timeout.ts";

/** AbortSignal.timeout no mantiene el event loop; el test sí tiene que esperarlo. */
async function untilSettled(promise) {
  const timer = setInterval(() => {}, 15);
  try {
    return await promise;
  } finally {
    clearInterval(timer);
  }
}

function hangingFetch() {
  let signal;
  const fetchImpl = (_input, init) =>
    new Promise((_resolve, reject) => {
      signal = init?.signal;
      if (!signal) {
        reject(new Error("missing signal"));
        return;
      }
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
  return {
    fetchImpl,
    get signal() {
      return signal;
    },
  };
}

describe("createFetchWithTimeout", { concurrency: 1 }, () => {
  test("aborts when the timeout elapses", async () => {
    const pending = hangingFetch();
    const fetchWithTimeout = createFetchWithTimeout(50, pending.fetchImpl);
    const started = Date.now();
    await untilSettled(
      assert.rejects(
        () => fetchWithTimeout("https://example.test/rest/v1/properties"),
        (error) => {
          assert.equal(error.name, "AbortError");
          return true;
        },
      ),
    );
    assert.equal(pending.signal.aborted, true);
    assert.ok(Date.now() - started < 1000);
  });

  test("preserves the caller signal and does not mutate init", async () => {
    const pending = hangingFetch();
    const controller = new AbortController();
    const init = {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      next: { revalidate: 3600, tags: ["published-content"] },
    };
    const fetchWithTimeout = createFetchWithTimeout(5_000, pending.fetchImpl);
    const request = fetchWithTimeout("https://example.test/rest/v1/properties", init);
    controller.abort(new DOMException("caller-cancelled", "AbortError"));
    await untilSettled(assert.rejects(request, (error) => {
      assert.equal(error.name, "AbortError");
      assert.equal(error.message, "caller-cancelled");
      return true;
    }));
    assert.equal(pending.signal.aborted, true);
    assert.notEqual(pending.signal, controller.signal);
    assert.equal(init.signal, controller.signal);
  });

  test("rejects immediately when the caller signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort(new DOMException("already", "AbortError"));
    let calls = 0;
    const fetchImpl = (_input, init) => {
      calls += 1;
      if (init?.signal?.aborted) return Promise.reject(init.signal.reason);
      return Promise.resolve(new Response("ok"));
    };
    await assert.rejects(
      () =>
        createFetchWithTimeout(5_000, fetchImpl)("https://example.test", {
          signal: controller.signal,
        }),
      (error) => {
        assert.equal(error.message, "already");
        return true;
      },
    );
    assert.equal(calls, 1);
  });

  test("passes init through, including Next cache options", async () => {
    let seen;
    const fetchImpl = async (input, init) => {
      seen = { input, init };
      return new Response("ok", { status: 201 });
    };
    const headers = { apikey: "publishable" };
    const init = {
      method: "GET",
      headers,
      cache: "no-store",
      body: undefined,
      next: { revalidate: 3600, tags: ["published-content"] },
    };
    const response = await createFetchWithTimeout(1_000, fetchImpl)(
      "https://example.test/rest/v1/properties?select=slug",
      init,
    );
    assert.equal(response.status, 201);
    assert.equal(seen.input, "https://example.test/rest/v1/properties?select=slug");
    assert.equal(seen.init.method, "GET");
    assert.equal(seen.init.cache, "no-store");
    assert.equal(seen.init.headers, headers);
    assert.deepEqual(seen.init.next, { revalidate: 3600, tags: ["published-content"] });
    assert.ok(seen.init.signal);
    assert.equal(init.signal, undefined);
  });

  test("falls back to AbortController when AbortSignal.any and timeout are missing", async () => {
    const originalAny = AbortSignal.any;
    const originalTimeout = AbortSignal.timeout;
    AbortSignal.any = undefined;
    AbortSignal.timeout = undefined;
    try {
      const pending = hangingFetch();
      const started = Date.now();
      await untilSettled(
        assert.rejects(
          () => createFetchWithTimeout(50, pending.fetchImpl)("https://example.test/rest"),
          (error) => {
            assert.equal(error.name, "AbortError");
            return true;
          },
        ),
      );
      assert.equal(pending.signal.aborted, true);
      assert.ok(Date.now() - started < 1000);

      const caller = hangingFetch();
      const controller = new AbortController();
      const request = createFetchWithTimeout(5_000, caller.fetchImpl)("https://example.test/rest", {
        signal: controller.signal,
        cache: "force-cache",
      });
      controller.abort(new DOMException("fallback-caller", "AbortError"));
      await untilSettled(
        assert.rejects(request, (error) => {
          assert.equal(error.message, "fallback-caller");
          return true;
        }),
      );
    } finally {
      AbortSignal.any = originalAny;
      AbortSignal.timeout = originalTimeout;
    }
  });

  test("reads SUPABASE_FETCH_TIMEOUT_MS and keeps upload and auth timeouts apart", () => {
    assert.equal(supabaseFetchTimeoutMs({}), DEFAULT_SUPABASE_FETCH_TIMEOUT_MS);
    assert.equal(supabaseFetchTimeoutMs({ SUPABASE_FETCH_TIMEOUT_MS: "2500" }), 2500);
    assert.equal(supabaseFetchTimeoutMs({ SUPABASE_FETCH_TIMEOUT_MS: "  " }), 5000);
    assert.equal(supabaseFetchTimeoutMs({ SUPABASE_FETCH_TIMEOUT_MS: "nope" }), 5000);
    assert.equal(supabaseFetchTimeoutMs({ SUPABASE_FETCH_TIMEOUT_MS: "0" }), 5000);
    assert.equal(supabaseFetchTimeoutMs({ SUPABASE_FETCH_TIMEOUT_MS: "-5" }), 5000);
    assert.equal(AUTH_OTP_TIMEOUT_MS, 20_000);
    assert.equal(STORAGE_UPLOAD_TIMEOUT_MS, 60_000);

    const upload = "https://xyz.supabase.co/storage/v1/object/dwell-media/submissions/a.jpg";
    const signed = "https://xyz.supabase.co/storage/v1/object/upload/sign/dwell-media/a.jpg?token=t";
    const list = "https://xyz.supabase.co/storage/v1/object/list/dwell-media";
    const read = "https://xyz.supabase.co/rest/v1/properties";
    assert.equal(isSupabaseStorageUpload(upload, { method: "POST" }), true);
    assert.equal(isSupabaseStorageUpload(upload, { method: "PUT" }), true);
    assert.equal(isSupabaseStorageUpload(upload, { method: "GET" }), false);
    assert.equal(isSupabaseStorageUpload(signed, { method: "PUT" }), true);
    assert.equal(isSupabaseStorageUpload(list, { method: "POST" }), false);
    assert.equal(isSupabaseStorageUpload(read, { method: "GET" }), false);
    assert.equal(resolveSupabaseRequestTimeoutMs(upload, { method: "POST" }, 5_000), 60_000);
    assert.equal(resolveSupabaseRequestTimeoutMs(upload, { method: "POST" }, 90_000), 90_000);
    assert.equal(resolveSupabaseRequestTimeoutMs(read, { method: "GET" }, 5_000), 5_000);
  });
});
