import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { imageRemotePatterns, supabaseStorageHostname } from "../lib/image-hosts.ts";
import {
  MAGIC_LINK_INBOX_MESSAGE,
  magicLinkHttpResult,
  magicLinkOtpOptions,
} from "../lib/magic-link.ts";
import {
  choosePublishedRow,
  choosePublishedRows,
} from "../lib/published-read.ts";
import {
  clientAddress,
  consumeRateLimit,
  hashRateLimitSubject,
  interpretRateLimitRpc,
  rateLimitFailure,
  rateLimitKey,
  shouldDispatchMagicLink,
} from "../lib/rate-limit.ts";
import { COOP_VALUE, HSTS_VALUE, contentSecurityPolicy } from "../lib/security-headers.ts";
import { cookieNamesToClear, endSession, shouldOfferSignOut } from "../lib/session-end.ts";

test("rate limit fails closed and does not store the raw email", async () => {
  const email = "person@example.com";
  const hashed = hashRateLimitSubject(email);
  assert.equal(hashed.includes("person"), false);
  assert.equal(hashed.length, 32);
  const key = rateLimitKey("magic:email", hashed);
  assert.equal(key.startsWith("magic:email:"), true);

  assert.equal(interpretRateLimitRpc({ data: true, error: null }), "allow");
  assert.equal(interpretRateLimitRpc({ data: false, error: null }), "deny");
  assert.equal(interpretRateLimitRpc({ data: null, error: { message: "down" } }), "unavailable");
  assert.equal(interpretRateLimitRpc({ data: "yes", error: null }), "unavailable");
  assert.equal(rateLimitFailure(["allow", "allow"]), null);
  assert.equal(rateLimitFailure(["allow", "deny"]), "rate_limited");
  assert.equal(rateLimitFailure(["allow", "unavailable"]), "rate_limit_unavailable");
  assert.equal(rateLimitFailure([]), "rate_limit_unavailable");
  assert.equal(shouldDispatchMagicLink(null), true);
  assert.equal(shouldDispatchMagicLink("rate_limited"), false);
  assert.equal(shouldDispatchMagicLink("rate_limit_unavailable"), false);

  const calls = [];
  const denied = await consumeRateLimit(
    {
      rpc(_fn, args) {
        calls.push(args.p_key);
        return Promise.resolve({ data: false, error: null });
      },
    },
    key,
    5,
    900,
  );
  assert.equal(denied, "deny");
  assert.equal(calls[0], key);

  const down = await consumeRateLimit(
    {
      rpc() {
        return Promise.reject(new Error("timeout"));
      },
    },
    key,
    5,
    900,
  );
  assert.equal(down, "unavailable");
  assert.equal(clientAddress("203.0.113.8, 10.0.0.1", null), "203.0.113.8");
  assert.equal(clientAddress("not an ip", null), "unknown");
});

test("magic link uses one inbox message and does not create users", () => {
  const invited = magicLinkHttpResult({ email: "owner@dwellhavana.com", configured: true });
  const stranger = magicLinkHttpResult({ email: "stranger@example.com", configured: true });
  assert.equal(invited.status, 200);
  assert.equal(stranger.status, 200);
  assert.equal(invited.body.message, MAGIC_LINK_INBOX_MESSAGE);
  assert.deepEqual(invited.body, stranger.body);

  const invalid = magicLinkHttpResult({ email: "not-an-email", configured: true });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.message === MAGIC_LINK_INBOX_MESSAGE, false);

  const options = magicLinkOtpOptions("https://dwell-havanna.vercel.app", "https://evil.example/phish");
  assert.equal(options.shouldCreateUser, false);
  assert.match(options.emailRedirectTo, /^https:\/\/dwell-havanna\.vercel\.app\/auth\/callback\?next=/);
  assert.equal(options.emailRedirectTo.includes("evil.example"), false);

  const route = readFileSync(new URL("../app/api/auth/magic-link/route.ts", import.meta.url), "utf8");
  assert.match(route, /magicLinkOtpOptions/);
  assert.equal(route.includes("shouldCreateUser: true"), false);
});

test("sign out clears auth cookies and the retired admin cookie", async () => {
  assert.equal(
    shouldOfferSignOut([{ name: "sb-abc-auth-token", value: "session" }]),
    true,
  );
  assert.equal(shouldOfferSignOut([{ name: "dh_admin", value: "old" }]), true);
  assert.equal(shouldOfferSignOut([{ name: "dh_admin", value: "" }]), false);
  assert.equal(shouldOfferSignOut([]), false);

  const deleted = [];
  let signedOut = 0;
  await endSession({
    cookieNames: ["sb-abc-auth-token", "dh_admin", "theme"],
    deleteCookie: (name) => {
      deleted.push(name);
    },
    signOutAuth: async () => {
      signedOut += 1;
    },
  });
  assert.equal(signedOut, 1);
  assert.deepEqual(deleted, ["sb-abc-auth-token", "dh_admin"]);
  assert.deepEqual(cookieNamesToClear(["theme", "sb-abc-auth-token.0"]), ["sb-abc-auth-token.0"]);

  const deletedAfterFailure = [];
  await endSession({
    cookieNames: ["dh_admin"],
    deleteCookie: (name) => {
      deletedAfterFailure.push(name);
    },
    signOutAuth: async () => {
      throw new Error("auth down");
    },
  });
  assert.deepEqual(deletedAfterFailure, ["dh_admin"]);
});

test("published reads prefer anon rows and keep the service fallback narrow", () => {
  assert.deepEqual(
    choosePublishedRows({ ok: true, rows: [{ slug: "a" }] }, { ok: true, rows: [{ slug: "draft-leak" }] }),
    [{ slug: "a" }],
  );
  assert.deepEqual(
    choosePublishedRows({ ok: true, rows: [] }, { ok: true, rows: [{ slug: "from-service" }] }),
    [{ slug: "from-service" }],
  );
  assert.deepEqual(choosePublishedRows({ ok: true, rows: [] }, { ok: true, rows: [] }), []);
  assert.equal(choosePublishedRows({ ok: true, rows: [] }, null), null);
  assert.equal(choosePublishedRows({ ok: true, rows: [] }, { ok: false }), null);
  assert.equal(choosePublishedRows({ ok: false }, { ok: false }), null);
  assert.equal(choosePublishedRow({ ok: true, row: { slug: "a" } }, { ok: true, row: null })?.slug, "a");
  assert.equal(choosePublishedRow({ ok: true, row: null }, { ok: true, row: null }), null);
  assert.equal(choosePublishedRow({ ok: true, row: null }, { ok: false }), undefined);
  assert.equal(choosePublishedRow({ ok: false }, { ok: false }), undefined);

  const content = readFileSync(new URL("../lib/content.ts", import.meta.url), "utf8");
  const db = readFileSync(new URL("../lib/db.ts", import.meta.url), "utf8");
  assert.match(content, /getPublishedFallbackClient/);
  assert.equal(content.includes("getServiceClient"), false);
  const fallback = db.slice(db.indexOf("export function getPublishedFallbackClient"));
  const service = fallback.indexOf("export function getServiceClient");
  assert.match(fallback.slice(0, service), /revalidate: 3600/);
  assert.equal(fallback.slice(0, service).includes('cache: "no-store"'), false);
});

test("csp, hsts and image hosts stay concrete", () => {
  const prod = contentSecurityPolicy("/", { dev: false });
  assert.match(prod, /script-src 'self' 'unsafe-inline'/);
  assert.equal(prod.includes("unsafe-eval"), false);
  assert.match(prod, /object-src 'none'/);
  assert.match(prod, /base-uri 'self'/);
  assert.match(prod, /frame-ancestors 'self'/);
  assert.match(prod, /upgrade-insecure-requests/);
  const embed = contentSecurityPolicy("/embed/casa", { dev: false });
  assert.match(embed, /frame-ancestors \*/);
  assert.equal(embed.includes("frame-ancestors 'self'"), false);
  const dev = contentSecurityPolicy("/", { dev: true });
  assert.match(dev, /unsafe-eval/);
  assert.equal(dev.includes("upgrade-insecure-requests"), false);
  const withHosts = contentSecurityPolicy("/embed/casa", {
    dev: false,
    extraImgHosts: ["images.unsplash.com", "*.supabase.co", "dwell-havanna.vercel.app"],
  });
  assert.match(withHosts, /https:\/\/images\.unsplash\.com/);
  assert.match(withHosts, /https:\/\/dwell-havanna\.vercel\.app/);
  assert.equal(withHosts.includes("*.supabase.co"), false);
  assert.match(HSTS_VALUE, /max-age=63072000/);
  assert.equal(COOP_VALUE, "same-origin");

  assert.equal(supabaseStorageHostname("https://abc123xyz.supabase.co"), "abc123xyz.supabase.co");
  assert.equal(supabaseStorageHostname("https://*.supabase.co"), null);
  assert.equal(supabaseStorageHostname("https://evil.supabase.co.attacker.test"), null);
  const patterns = imageRemotePatterns("https://abcdefghij1234567890.supabase.co");
  assert.deepEqual(
    patterns.map((pattern) => pattern.hostname),
    ["images.unsplash.com", "abcdefghij1234567890.supabase.co"],
  );
  assert.equal(patterns.some((pattern) => pattern.hostname.includes("*")), false);
  assert.equal(imageRemotePatterns(undefined).some((pattern) => pattern.hostname === "picsum.photos"), false);
});

test("emergency admin token is gone from the auth path", () => {
  const auth = readFileSync(new URL("../lib/editorial-auth.ts", import.meta.url), "utf8");
  const admin = readFileSync(new URL("../app/admin/review/page.tsx", import.meta.url), "utf8");
  const example = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  assert.equal(auth.includes("ADMIN_TOKEN"), false);
  assert.equal(admin.includes("ADMIN_TOKEN"), false);
  assert.equal(admin.includes("dh_admin"), false);
  assert.equal(/^\s*ADMIN_TOKEN=/m.test(example), false);
  assert.equal(/^\s*ADMIN_TOKEN_TTL_SECONDS=/m.test(example), false);
  assert.match(example, /borra ADMIN_TOKEN/);
  assert.match(readFileSync(new URL("../lib/db.ts", import.meta.url), "utf8"), /import "server-only"/);
});
