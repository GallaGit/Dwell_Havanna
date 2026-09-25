import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  safeRedirectPath,
} from "../lib/safe-redirect.ts";

const origin = "https://dwellhavana.com";

function staysOnSite(path) {
  const resolved = new URL(path, origin);
  assert.equal(resolved.origin, origin);
  assert.equal(resolved.pathname.startsWith("//"), false);
  assert.equal(resolved.pathname.includes("\\"), false);
}

test("allows same-origin relative paths", () => {
  const allowed = [
    ["/admin/review", "/admin/review"],
    ["/contribuir", "/contribuir"],
    ["/", "/"],
    ["/journal/light-in-vedado", "/journal/light-in-vedado"],
    ["/admin/review?welcome=1", "/admin/review?welcome=1"],
    ["/properties/casa-miramar-1938#facts", "/properties/casa-miramar-1938#facts"],
    ["  /admin/review  ", "/admin/review"],
  ];

  for (const [input, expected] of allowed) {
    const path = safeRedirectPath(input, origin);
    assert.equal(path, expected);
    staysOnSite(path);
  }
});

test("falls back when next is missing or not a relative path", () => {
  for (const input of [null, undefined, "", "   ", "admin/review", "contribuir"]) {
    assert.equal(safeRedirectPath(input, origin), DEFAULT_AUTH_REDIRECT_PATH);
  }
});

test("rejects open-redirect variants", () => {
  const attacks = [
    "//evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "/\\\\evil.example",
    "/%2F%2Fevil.example",
    "/%2f%2fevil.example",
    "/%5C%5Cevil.example",
    "/%5c%5cevil.example",
    "/%5Cevil.example",
    "/%255C%255Cevil.example",
    "/%252F%252Fevil.example",
    "/%25252F%25252Fevil.example",
    "///evil.example",
    "/.//evil.example",
    "/foo/..//evil.example",
    "\\\\evil.example",
    "https://evil.example",
    "http://evil.example/admin",
    "javascript:alert(1)",
    "//evil.example\\@dwellhavana.com",
    "https://dwellhavana.com.evil.example",
    "http://dwellhavana.com/admin",
    "https://dwellhavana.com/admin",
    "/admin/review%00",
    "/admin/review%0a",
  ];

  for (const input of attacks) {
    const path = safeRedirectPath(input, origin);
    assert.equal(path, DEFAULT_AUTH_REDIRECT_PATH, input);
    staysOnSite(path);
  }
});

test("uses the caller fallback when it is a safe path", () => {
  assert.equal(safeRedirectPath("//evil.example", origin, "/admin/review"), "/admin/review");
});
