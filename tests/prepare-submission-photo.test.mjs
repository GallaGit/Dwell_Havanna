import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  fitLongEdge,
  JPEG_QUALITIES,
  MAX_LONG_EDGE,
  readJpegLayout,
  scaleSteps,
  shouldKeepOriginalJpeg,
  shrinkToLimit,
} from "../lib/prepare-submission-photo.mjs";
import { MAX_SUBMISSION_BYTES } from "../lib/submissions-validation.mjs";

test("a jpeg already under 4 MB and 2560 px is kept", () => {
  assert.equal(
    shouldKeepOriginalJpeg({
      isJpeg: true,
      byteLength: MAX_SUBMISSION_BYTES,
      width: MAX_LONG_EDGE,
      height: 1000,
    }),
    true,
  );
  assert.equal(
    shouldKeepOriginalJpeg({
      isJpeg: true,
      byteLength: MAX_SUBMISSION_BYTES + 1,
      width: 800,
      height: 600,
    }),
    false,
  );
  assert.equal(
    shouldKeepOriginalJpeg({
      isJpeg: true,
      byteLength: 1000,
      width: MAX_LONG_EDGE + 1,
      height: 100,
    }),
    false,
  );
  assert.equal(
    shouldKeepOriginalJpeg({ isJpeg: false, byteLength: 1000, width: 800, height: 600 }),
    false,
  );
});

test("scale steps shrink the long edge and never upscale", () => {
  const large = scaleSteps(4000, 2000);
  assert.deepEqual(large[0], fitLongEdge(4000, 2000, MAX_LONG_EDGE));
  assert.equal(large[0].width, 2560);
  assert.equal(large[0].height, 1280);
  assert.equal(Math.max(large[1].width, large[1].height), 2048);
  assert.ok(large.every((step, index) => index === 0 || Math.max(step.width, step.height) < Math.max(large[index - 1].width, large[index - 1].height)));

  assert.deepEqual(scaleSteps(1000, 500), [
    { width: 1000, height: 500 },
    { width: 800, height: 400 },
  ]);
  assert.deepEqual(scaleSteps(500, 400), [{ width: 500, height: 400 }]);
  assert.deepEqual(scaleSteps(0, 10), []);
});

test("shrink stops at the first quality that fits, then tries a smaller edge", async () => {
  const calls = [];
  const fitted = await shrinkToLimit({
    width: 4000,
    height: 2000,
    maxBytes: 100,
    encode: async (step) => {
      calls.push(step);
      const byteLength = step.quality === JPEG_QUALITIES[0] ? 150 : 80;
      return { byteLength, payload: step.quality };
    },
  });
  assert.equal(calls.length, 2);
  assert.equal(fitted.quality, JPEG_QUALITIES[1]);
  assert.equal(fitted.width, 2560);
  assert.equal(fitted.payload, JPEG_QUALITIES[1]);

  const smaller = await shrinkToLimit({
    width: 4000,
    height: 2000,
    maxBytes: 100,
    encode: async (step) => {
      const byteLength = Math.max(step.width, step.height) > 2048 ? 200 : 90;
      return { byteLength, payload: step.width };
    },
  });
  assert.equal(Math.max(smaller.width, smaller.height), 2048);

  const impossible = await shrinkToLimit({
    width: 800,
    height: 600,
    maxBytes: 10,
    encode: async () => ({ byteLength: 50, payload: null }),
  });
  assert.equal(impossible, null);
});

test("jpeg layout reads pixel size and applies EXIF orientation", async () => {
  const wide = await sharp({
    create: {
      width: 8,
      height: 2,
      channels: 3,
      background: { r: 10, g: 20, b: 30 },
    },
  })
    .jpeg()
    .toBuffer();

  assert.deepEqual(readJpegLayout(wide), { width: 8, height: 2 });
  assert.equal(readJpegLayout(Buffer.from("not-a-jpeg")), null);
  assert.equal(readJpegLayout(wide.subarray(0, 4)), null);

  const oriented = Buffer.concat([wide.subarray(0, 2), exifOrientation(6), wide.subarray(2)]);
  assert.deepEqual(readJpegLayout(oriented), { width: 2, height: 8 });
  assert.deepEqual(readJpegLayout(Buffer.concat([wide.subarray(0, 2), exifOrientation(1), wide.subarray(2)])), {
    width: 8,
    height: 2,
  });
});

function exifOrientation(value) {
  const tiff = Buffer.from([
    0x49, 0x49, 0x2a, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x01, 0x00,
    0x12, 0x01,
    0x03, 0x00,
    0x01, 0x00, 0x00, 0x00,
    value, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);
  const payload = Buffer.concat([Buffer.from("Exif\0\0"), tiff]);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length + 2);
  return Buffer.concat([Buffer.from([0xff, 0xe1]), length, payload]);
}
