import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hasSupabaseAuthCookie, isSupabaseAuthCookieName } from "../lib/auth-cookie.ts";
import { deliveryImageUrl } from "../lib/image-delivery.ts";
import {
  PLACEHOLDER_CONTACT_EMAIL,
  contactEmail,
  journalPlaceholderParagraphs,
  placeholderImage,
} from "../lib/placeholders.ts";

function channel(hex) {
  const value = Number.parseInt(hex, 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrast(foreground, background) {
  const lum = (hex) => {
    const raw = hex.replace("#", "");
    return (
      0.2126 * channel(raw.slice(0, 2)) +
      0.7152 * channel(raw.slice(2, 4)) +
      0.0722 * channel(raw.slice(4, 6))
    );
  };
  const lighter = Math.max(lum(foreground), lum(background));
  const darker = Math.min(lum(foreground), lum(background));
  return (lighter + 0.05) / (darker + 0.05);
}

test("muted meets AA on paper and cream", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const token = (name) => {
    const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
    assert.ok(match, name);
    return match[1];
  };
  const muted = token("--color-muted");
  assert.ok(contrast(muted, token("--color-paper")) >= 4.5);
  assert.ok(contrast(muted, token("--color-cream")) >= 4.5);
});

test("auth cookie detection ignores anonymous requests", () => {
  assert.equal(isSupabaseAuthCookieName("sb-abc-auth-token"), true);
  assert.equal(isSupabaseAuthCookieName("sb-abc-auth-token.0"), true);
  assert.equal(isSupabaseAuthCookieName("dh_admin"), false);
  assert.equal(hasSupabaseAuthCookie([{ name: "sb-abc-auth-token", value: "" }]), false);
  assert.equal(
    hasSupabaseAuthCookie([{ name: "sb-abc-auth-token", value: "session" }]),
    true,
  );
});

test("delivery image url uses the optimizer", () => {
  const url = new URL(
    deliveryImageUrl("https://example.supabase.co/storage/v1/object/public/dwell-media/a.jpg"),
  );
  assert.equal(url.pathname, "/_next/image");
  assert.equal(url.searchParams.get("w"), "1200");
  assert.equal(url.searchParams.get("q"), "70");
  assert.match(url.searchParams.get("url") ?? "", /dwell-media\/a\.jpg$/);
});

test("placeholder contact and journal body stay centralized", () => {
  assert.equal(PLACEHOLDER_CONTACT_EMAIL, "hola@dwellhavana.example");
  const configured = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  assert.equal(contactEmail, configured || PLACEHOLDER_CONTACT_EMAIL);
  assert.equal(journalPlaceholderParagraphs.length, 3);
  assert.match(placeholderImage("photo-example"), /^https:\/\/images\.unsplash\.com\/photo-example\?/);
  const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.equal(home.includes("images.unsplash.com"), false);
  const journal = readFileSync(new URL("../app/journal/[slug]/page.tsx", import.meta.url), "utf8");
  assert.equal(journal.includes("Havana rewards slow looking"), false);
});
