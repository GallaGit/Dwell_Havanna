import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SITE_URL, canonicalFor, resolveSiteUrl, siteUrl } from "../lib/site.ts";

test("unset site url uses the default and does not warn", () => {
  const warnings = [];
  assert.equal(resolveSiteUrl(undefined, (message) => warnings.push(message)), DEFAULT_SITE_URL);
  assert.equal(resolveSiteUrl(null, (message) => warnings.push(message)), DEFAULT_SITE_URL);
  assert.equal(warnings.length, 0);
  assert.equal(new URL(siteUrl).protocol === "http:" || new URL(siteUrl).protocol === "https:", true);
});

test("empty, whitespace, and invalid site urls fall back", () => {
  const invalid = [
    "",
    "   ",
    "\n\t",
    "/",
    " / ",
    "not a url",
    "dwellhavana.com",
    "javascript:alert(1)",
    "ftp://dwellhavana.com",
    "file:///tmp/site",
  ];

  for (const value of invalid) {
    const warnings = [];
    const resolved = resolveSiteUrl(value, (message) => warnings.push(message));
    assert.equal(resolved, DEFAULT_SITE_URL, value);
    assert.equal(warnings.length, 1, value);
    assert.match(warnings[0], /NEXT_PUBLIC_SITE_URL/);
    assert.doesNotThrow(() => new URL(resolved));
  }
});

test("a valid site url is preserved and trailing slashes are removed", () => {
  const warnings = [];
  const warn = (message) => warnings.push(message);
  assert.equal(resolveSiteUrl("https://dwellhavana.com", warn), "https://dwellhavana.com");
  assert.equal(resolveSiteUrl("https://dwellhavana.com/", warn), "https://dwellhavana.com");
  assert.equal(resolveSiteUrl("https://dwellhavana.com///", warn), "https://dwellhavana.com");
  assert.equal(
    resolveSiteUrl("https://dwell-havanna.vercel.app/", warn),
    "https://dwell-havanna.vercel.app",
  );
  assert.equal(
    resolveSiteUrl("  https://dwellhavana.com/base/  ", warn),
    "https://dwellhavana.com/base",
  );
  assert.equal(resolveSiteUrl("http://localhost:3000/", warn), "http://localhost:3000");
  assert.equal(warnings.length, 0);
  assert.equal(canonicalFor("journal/light-in-vedado").startsWith(siteUrl), true);
});
