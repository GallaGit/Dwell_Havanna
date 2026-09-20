import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const requiredEnvironment = [
  "E2E_SUPABASE_URL",
  "E2E_SUPABASE_PUBLISHABLE_KEY",
  "E2E_SUPABASE_SERVICE_ROLE_KEY",
  "E2E_CONTRIBUTOR_HANDLE",
  "E2E_AUTH_COOKIE",
];
const environmentReady = requiredEnvironment.every((name) => process.env[name]);
const confirmation = process.env.E2E_SUPABASE_CONFIRM === "dwell-havana-e2e";
const shouldRun = environmentReady && confirmation;
const baseUrl = "http://127.0.0.1:3100";
const bucket = "dwell-media";
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);

function formData({ handle, rights = "on" }) {
  const form = new FormData();
  form.set("handle", handle);
  form.set("caption", "Automated HTTP E2E submission");
  form.set("rights", rights);
  form.set("photo", new File([jpeg], "e2e-submission.jpg", { type: "image/jpeg" }));
  return form;
}

async function waitForServer(child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js exited before becoming ready (${child.exitCode})`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/submissions`);
      if (response.status !== 404 && response.status !== 503) return;
    } catch {
      // The dev server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Timed out waiting for the Next.js server");
}

async function readJson(response) {
  return response.json();
}

test("POST /api/submissions validates and persists a submission over HTTP", {
  skip: !shouldRun
    ? "Set E2E_SUPABASE_URL, E2E_SUPABASE_PUBLISHABLE_KEY, E2E_SUPABASE_SERVICE_ROLE_KEY, E2E_CONTRIBUTOR_HANDLE, E2E_AUTH_COOKIE and E2E_SUPABASE_CONFIRM=dwell-havana-e2e to run against a dedicated Supabase test project"
    : false,
}, async () => {
  const db = createClient(
    process.env.E2E_SUPABASE_URL,
    process.env.E2E_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const server = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3100"], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.E2E_SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SITE_URL: baseUrl,
    },
    stdio: "ignore",
    windowsHide: true,
  });

  let submissionId;
  let storagePath;
  try {
    await waitForServer(server);

    const unauthenticated = await fetch(`${baseUrl}/api/submissions`, {
      method: "POST",
      body: formData({ handle: process.env.E2E_CONTRIBUTOR_HANDLE }),
    });
    assert.equal(unauthenticated.status, 401);
    assert.equal((await readJson(unauthenticated)).error, "authentication_required");

    const missingRights = await fetch(`${baseUrl}/api/submissions`, {
      method: "POST",
      body: formData({ handle: process.env.E2E_CONTRIBUTOR_HANDLE, rights: "" }),
      headers: { cookie: process.env.E2E_AUTH_COOKIE },
    });
    assert.equal(missingRights.status, 422);
    assert.equal((await readJson(missingRights)).error, "rights_required");

    const unknownContributor = await fetch(`${baseUrl}/api/submissions`, {
      method: "POST",
      body: formData({ handle: "@e2e-unknown-contributor" }),
      headers: { cookie: process.env.E2E_AUTH_COOKIE },
    });
    assert.equal(unknownContributor.status, 403);
    assert.equal((await readJson(unknownContributor)).error, "unknown_contributor");

    const validSubmission = await fetch(`${baseUrl}/api/submissions`, {
      method: "POST",
      body: formData({ handle: process.env.E2E_CONTRIBUTOR_HANDLE }),
      headers: { cookie: process.env.E2E_AUTH_COOKIE },
    });
    assert.equal(validSubmission.status, 200);
    const validPayload = await readJson(validSubmission);
    assert.equal(validPayload.ok, true);
    assert.match(validPayload.id, /^[0-9a-f-]{36}$/i);
    submissionId = validPayload.id;

    const { data: submission, error: lookupError } = await db
      .from("submissions")
      .select("id, image_url, status, rights_granted")
      .eq("id", submissionId)
      .single();
    assert.ifError(lookupError);
    assert.equal(submission.status, "pending");
    assert.equal(submission.rights_granted, true);
    const marker = `/storage/v1/object/public/${bucket}/`;
    assert.ok(submission.image_url.includes(marker));
    storagePath = decodeURIComponent(submission.image_url.split(marker)[1]);
  } finally {
    server.kill();

    if (submissionId) {
      const { error } = await db.from("submissions").delete().eq("id", submissionId);
      assert.ifError(error);
    }
    if (storagePath) {
      const { error } = await db.storage.from(bucket).remove([storagePath]);
      assert.ifError(error);
    }
  }
});
