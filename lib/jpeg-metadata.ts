import sharp from "sharp";
import { isJpeg, MAX_SUBMISSION_BYTES } from "./submissions-validation.mjs";

/** Lado máximo aceptado antes de reencodear. */
export const MAX_IMAGE_EDGE = 8000;
/** Píxeles decodificados como máximo. Un JPEG pequeño puede expandirse mucho. */
export const MAX_IMAGE_PIXELS = 24_000_000;

export type JpegErrorCode = "photo_must_be_jpeg" | "photo_dimensions" | "photo_too_large";

export class JpegProcessingError extends Error {
  readonly code: JpegErrorCode;

  constructor(code: JpegErrorCode) {
    super(code);
    this.name = "JpegProcessingError";
    this.code = code;
  }
}

export function imageBoundsError(width: number, height: number): "photo_dimensions" | null {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return "photo_dimensions";
  if (width < 1 || height < 1) return "photo_dimensions";
  if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE) return "photo_dimensions";
  if (width * height > MAX_IMAGE_PIXELS) return "photo_dimensions";
  return null;
}

/**
 * Reencodea a JPEG baseline. `rotate()` aplica la orientación EXIF y el
 * encoder de sharp no escribe EXIF, GPS ni el resto de metadatos.
 */
export async function stripJpegMetadata(bytes: Uint8Array): Promise<Buffer> {
  if (!isJpeg(bytes)) throw new JpegProcessingError("photo_must_be_jpeg");

  try {
    const source = sharp(bytes, {
      failOn: "error",
      limitInputPixels: MAX_IMAGE_PIXELS,
    });
    const meta = await source.metadata();
    const bounds = imageBoundsError(meta.width ?? 0, meta.height ?? 0);
    if (bounds) throw new JpegProcessingError(bounds);

    const oriented = source.rotate();
    let output = await oriented.jpeg({ quality: 85 }).toBuffer();
    if (output.length > MAX_SUBMISSION_BYTES) {
      output = await sharp(bytes, {
        failOn: "error",
        limitInputPixels: MAX_IMAGE_PIXELS,
      })
        .rotate()
        .jpeg({ quality: 70 })
        .toBuffer();
    }
    if (output.length > MAX_SUBMISSION_BYTES) {
      throw new JpegProcessingError("photo_too_large");
    }
    return output;
  } catch (error) {
    if (error instanceof JpegProcessingError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (/pixel limit|exceeds pixel/i.test(message)) {
      throw new JpegProcessingError("photo_dimensions");
    }
    throw new JpegProcessingError("photo_must_be_jpeg");
  }
}
