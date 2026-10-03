import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contributorInviteDecision } from "../lib/contributor-invite.mjs";
import {
  locateStoredObject,
  pendingObjectPath,
  planSubmissionObject,
  PRIVATE_BUCKET,
  publishTarget,
  PUBLISHED_BUCKET,
  removalTarget,
} from "../lib/submission-media.mjs";

const FILE_ID = "11111111-1111-4111-8111-111111111111";
const LEGACY_URL =
  "https://example.supabase.co/storage/v1/object/public/dwell-media/submissions/gallados-lab/" +
  `${FILE_ID}.jpg`;

test("new pending paths do not include the contributor handle", () => {
  const path = pendingObjectPath(FILE_ID);
  assert.equal(path, `submissions/${FILE_ID}.jpg`);
  assert.equal(path.includes("gallados"), false);
  assert.equal(path.includes("@"), false);
  assert.equal(pendingObjectPath("../etc/passwd"), null);
});

test("legacy public URLs still locate the private object, handle and all", () => {
  assert.deepEqual(locateStoredObject(LEGACY_URL), {
    bucket: PRIVATE_BUCKET,
    path: `submissions/gallados-lab/${FILE_ID}.jpg`,
  });
  assert.deepEqual(removalTarget(LEGACY_URL), {
    bucket: PRIVATE_BUCKET,
    path: `submissions/gallados-lab/${FILE_ID}.jpg`,
  });
});

test("reject deletes the private original and approve publishes only the uuid", () => {
  const pending = `submissions/${FILE_ID}.jpg`;
  assert.deepEqual(removalTarget(pending), { bucket: PRIVATE_BUCKET, path: pending });
  assert.deepEqual(publishTarget(pending), {
    fromBucket: PRIVATE_BUCKET,
    fromPath: pending,
    toBucket: PUBLISHED_BUCKET,
    toPath: `${FILE_ID}.jpg`,
  });
  assert.equal(publishTarget(pending).toPath.includes("gallados"), false);

  const publishedUrl =
    `https://example.supabase.co/storage/v1/object/public/dwell-published/${FILE_ID}.jpg`;
  assert.equal(removalTarget(publishedUrl), null);
  assert.equal(publishTarget(publishedUrl), null);
});

test("migration plan moves pending files off the handle, republishes approved ones, and deletes rejected ones", () => {
  assert.deepEqual(planSubmissionObject("pending", LEGACY_URL), {
    action: "move",
    bucket: PRIVATE_BUCKET,
    from: `submissions/gallados-lab/${FILE_ID}.jpg`,
    to: `submissions/${FILE_ID}.jpg`,
    imageUrl: `submissions/${FILE_ID}.jpg`,
  });
  assert.equal(planSubmissionObject("pending", `submissions/${FILE_ID}.jpg`).action, "keep");
  assert.deepEqual(planSubmissionObject("approved", LEGACY_URL).action, "republish");
  assert.equal(planSubmissionObject("approved", LEGACY_URL).toPath, `${FILE_ID}.jpg`);
  assert.deepEqual(planSubmissionObject("rejected", LEGACY_URL), {
    action: "delete",
    bucket: PRIVATE_BUCKET,
    path: `submissions/gallados-lab/${FILE_ID}.jpg`,
  });
  assert.equal(planSubmissionObject("pending", "https://images.unsplash.com/photo.jpg").action, "skip");
  assert.equal(locateStoredObject("submissions/../secret.jpg"), null);
});

test("reinviting a linked handle does not replace auth_user_id", () => {
  assert.equal(contributorInviteDecision(null), "link");
  assert.equal(contributorInviteDecision(undefined), "link");
  assert.equal(contributorInviteDecision(""), "link");
  assert.equal(contributorInviteDecision("   "), "link");
  assert.equal(
    contributorInviteDecision("22222222-2222-4222-8222-222222222222"),
    "already_linked",
  );

  const review = readFileSync(new URL("../app/admin/review/page.tsx", import.meta.url), "utf8");
  assert.match(review, /\.is\("auth_user_id", null\)/);
  assert.match(review, /contributorInviteDecision\(contributor\.auth_user_id\)/);
});

test("canonical SQL forces the existing bucket private and drops the broad read policy", () => {
  const schema = readFileSync(new URL("../supabase/01-schema.sql", import.meta.url), "utf8");
  const migration = readFileSync(
    new URL("../supabase/migrations/20261003150500_private_dwell_media.sql", import.meta.url),
    "utf8",
  );
  const apply = readFileSync(new URL("../scripts/apply-canonical-sql.sh", import.meta.url), "utf8");

  for (const sql of [schema, migration]) {
    assert.match(sql, /values \('dwell-media', 'dwell-media', false\)/);
    assert.match(sql, /on conflict \(id\) do update\s+set public = false/i);
    assert.match(sql, /set public = false\s+where id = 'dwell-media'/i);
    assert.match(sql, /values \('dwell-published', 'dwell-published', true\)/);
    assert.match(sql, /drop policy if exists "dwell-media public read"/);
    assert.equal(sql.includes("create policy \"dwell-media public read\""), false);
    assert.equal(sql.includes("values ('dwell-media', 'dwell-media', true)"), false);
  }
  assert.match(apply, /20261003150500_private_dwell_media\.sql/);
});
