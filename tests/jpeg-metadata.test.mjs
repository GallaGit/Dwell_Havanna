import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  imageBoundsError,
  JpegProcessingError,
  MAX_IMAGE_EDGE,
  stripJpegMetadata,
} from "../lib/jpeg-metadata.ts";

test("image bounds reject an edge that is too long", () => {
  assert.equal(imageBoundsError(32, 32), null);
  assert.equal(imageBoundsError(MAX_IMAGE_EDGE + 1, 10), "photo_dimensions");
  assert.equal(imageBoundsError(0, 10), "photo_dimensions");
});

test("reencode drops EXIF and applies orientation", async () => {
  const wide = await sharp({
    create: {
      width: 8,
      height: 2,
      channels: 3,
      background: { r: 180, g: 20, b: 20 },
    },
  })
    .jpeg()
    .toBuffer();

  const payload = Buffer.concat([
    Buffer.from("Exif\0\0"),
    Buffer.from("GPS_SECRET_LOCATION"),
  ]);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length + 2);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), length, payload]);
  const withExif = Buffer.concat([wide.subarray(0, 2), app1, wide.subarray(2)]);
  assert.equal(withExif.includes(Buffer.from("GPS_SECRET_LOCATION")), true);

  const strippedSecret = await stripJpegMetadata(withExif);
  assert.equal(strippedSecret.includes(Buffer.from("GPS_SECRET_LOCATION")), false);
  assert.equal(strippedSecret.includes(Buffer.from("Exif")), false);

  const oriented = await sharp(wide).withMetadata({ orientation: 6 }).toBuffer();
  assert.equal(oriented.includes(Buffer.from("Exif")), true);
  const stripped = await stripJpegMetadata(oriented);
  const meta = await sharp(stripped).metadata();
  assert.equal(stripped[0], 0xff);
  assert.equal(stripped[1], 0xd8);
  assert.equal(stripped.includes(Buffer.from("Exif")), false);
  assert.equal(meta.exif, undefined);
  assert.equal(meta.width, 2);
  assert.equal(meta.height, 8);
});

test("a non-jpeg buffer is rejected before reencoding", async () => {
  await assert.rejects(
    () => stripJpegMetadata(new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
    (error) => error instanceof JpegProcessingError && error.code === "photo_must_be_jpeg",
  );
});
