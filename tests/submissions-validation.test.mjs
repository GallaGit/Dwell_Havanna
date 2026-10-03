import assert from "node:assert/strict";
import test from "node:test";
import {
  contentLengthExceeded,
  isJpeg,
  MAX_REQUEST_BYTES,
  MAX_SUBMISSION_BYTES,
  readBodyWithLimit,
  sanitizeHandle,
  validateSubmissionFields,
} from "../lib/submissions-validation.mjs";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

test("normalizes contributor handles for storage paths", () => {
  assert.equal(sanitizeHandle(" @GallaDos Lab! "), "gallados-lab");
});

test("accepts a valid JPEG submission", () => {
  assert.equal(validateSubmissionFields({
    handle: "@gallados_lab",
    caption: "A caption",
    rights: "on",
    photoSize: jpeg.length,
    photoBytes: jpeg,
  }), null);
});

test("rejects missing rights before processing the upload", () => {
  assert.equal(validateSubmissionFields({
    handle: "@gallados_lab",
    caption: "A caption",
    rights: "",
    photoSize: jpeg.length,
    photoBytes: jpeg,
  }), "rights_required");
});

test("rejects files with a non-JPEG signature", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  assert.equal(isJpeg(png), false);
  assert.equal(validateSubmissionFields({
    handle: "@gallados_lab",
    caption: "A caption",
    rights: "true",
    photoSize: png.length,
    photoBytes: png,
  }), "photo_must_be_jpeg");
});

test("rejects files over 4 MB", () => {
  assert.equal(MAX_SUBMISSION_BYTES, 4 * 1024 * 1024);
  assert.equal(validateSubmissionFields({
    handle: "@gallados_lab",
    caption: "A caption",
    rights: "true",
    photoSize: MAX_SUBMISSION_BYTES + 1,
    photoBytes: jpeg,
  }), "photo_too_large");
});

test("rejects an oversized Content-Length before the body is read", () => {
  assert.equal(contentLengthExceeded(null), false);
  assert.equal(contentLengthExceeded(""), false);
  assert.equal(contentLengthExceeded(String(MAX_REQUEST_BYTES)), false);
  assert.equal(contentLengthExceeded(String(MAX_REQUEST_BYTES + 1)), true);
  assert.equal(contentLengthExceeded("nope"), true);
});

test("stops reading a body once it passes the request cap", async () => {
  let pulls = 0;
  const body = new ReadableStream({
    pull(controller) {
      pulls += 1;
      controller.enqueue(new Uint8Array(3));
    },
  });
  const result = await readBodyWithLimit(body, 4);
  assert.deepEqual(result, { ok: false, error: "body_too_large" });
  assert.ok(pulls < 5);

  const small = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2]));
      controller.enqueue(new Uint8Array([3]));
      controller.close();
    },
  });
  const accepted = await readBodyWithLimit(small, 4);
  assert.equal(accepted.ok, true);
  assert.deepEqual(Array.from(accepted.bytes), [1, 2, 3]);
});
