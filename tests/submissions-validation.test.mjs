import assert from "node:assert/strict";
import test from "node:test";
import {
  isJpeg,
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

test("rejects files over 8 MB", () => {
  assert.equal(validateSubmissionFields({
    handle: "@gallados_lab",
    caption: "A caption",
    rights: "true",
    photoSize: 8 * 1024 * 1024 + 1,
    photoBytes: jpeg,
  }), "photo_too_large_8mb");
});
