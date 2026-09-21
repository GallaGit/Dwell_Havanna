import assert from "node:assert/strict";
import test from "node:test";
import {
  canInvite,
  canManageMembers,
  canReview,
  getActiveEditorialAccess,
} from "../lib/editorial-permissions.ts";

const member = (role, active = true) => ({
  auth_user_id: `${role}-user`,
  role,
  active,
  display_name: `${role} test user`,
});

test("owner can review and invite contributors", () => {
  const access = getActiveEditorialAccess(member("owner"));

  assert.ok(access);
  assert.equal(canReview(access), true);
  assert.equal(canInvite(access), true);
  assert.equal(canManageMembers(access), true);
});

test("moderator can review but cannot invite contributors", () => {
  const access = getActiveEditorialAccess(member("moderator"));

  assert.ok(access);
  assert.equal(canReview(access), true);
  assert.equal(canInvite(access), false);
  assert.equal(canManageMembers(access), false);
});

test("inactive or malformed members receive no editorial access", () => {
  assert.equal(getActiveEditorialAccess(member("owner", false)), null);
  assert.equal(getActiveEditorialAccess(member("inactive")), null);
  assert.equal(getActiveEditorialAccess(null), null);
  assert.equal(canReview(null), false);
  assert.equal(canInvite(null), false);
  assert.equal(canManageMembers(null), false);
});

test("legacy fallback can review and invite", () => {
  const access = { kind: "legacy", member: null };

  assert.equal(canReview(access), true);
  assert.equal(canInvite(access), true);
  assert.equal(canManageMembers(access), false);
});
