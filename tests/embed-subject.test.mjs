import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { embedStaticParams, pickEmbedSubject } from "../lib/embed.ts";

const properties = [
  { slug: "casa-miramar-1938", name: "Casa Miramar, 1938" },
  { slug: "apartamento-vedado-luz", name: "Apartamento Vedado" },
  { slug: "casa-colon-patio", name: "Casa Colón" },
];

const journalPosts = [
  { slug: "light-in-vedado", title: "Light in El Vedado" },
  { slug: "terrazzo-memory", title: "Terrazzo as memory" },
  { slug: "patio-houses", title: "The patio house endures" },
  { slug: "people-who-restore", title: "The people who restore, quietly" },
];

test("embed params cover published properties and journal posts", () => {
  const params = embedStaticParams(properties, journalPosts);
  const slugs = params.map((param) => param.slug);
  assert.equal(slugs.length, 7);
  for (const property of properties) {
    assert.equal(slugs.includes(property.slug), true);
    assert.equal(pickEmbedSubject(property.slug, properties, journalPosts)?.kind, "property");
  }
  for (const post of journalPosts) {
    assert.equal(slugs.includes(post.slug), true);
    const subject = pickEmbedSubject(post.slug, properties, journalPosts);
    assert.equal(subject?.kind, "post");
    if (subject?.kind === "post") {
      assert.equal(subject.post.slug, post.slug);
    }
  }
});

test("a journal slug is not treated as a property", () => {
  for (const post of journalPosts) {
    const withoutProperties = pickEmbedSubject(post.slug, [], journalPosts);
    assert.equal(withoutProperties?.kind, "post");
    const missingPost = pickEmbedSubject(post.slug, properties, []);
    assert.equal(missingPost, null);
  }
});

test("unknown slugs are absent and a shared slug stays a property", () => {
  assert.equal(pickEmbedSubject("no-such-slug", properties, journalPosts), null);
  const sharedProperty = { ...properties[0], slug: journalPosts[0].slug };
  const subject = pickEmbedSubject(sharedProperty.slug, [sharedProperty], journalPosts);
  assert.equal(subject?.kind, "property");
  const params = embedStaticParams([sharedProperty], journalPosts);
  assert.equal(params.filter((param) => param.slug === sharedProperty.slug).length, 1);
});

test("the embed route does not look up a slug in the other table", () => {
  const source = readFileSync(new URL("../app/embed/[slug]/route.ts", import.meta.url), "utf8");
  assert.equal(source.includes("getPropertyBySlug"), false);
  assert.equal(source.includes("getPostBySlug"), false);
  assert.match(source, /pickEmbedSubject/);
  assert.match(source, /embedStaticParams/);
  assert.match(source, /listPublishedProperties/);
  assert.match(source, /listPublishedPosts/);
});
