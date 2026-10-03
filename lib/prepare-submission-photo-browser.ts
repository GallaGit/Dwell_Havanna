import {
  fitLongEdge,
  MAX_LONG_EDGE,
  MAX_SUBMISSION_BYTES,
  readJpegLayout,
  shouldKeepOriginalJpeg,
  shrinkToLimit,
} from "@/lib/prepare-submission-photo.mjs";
import { isJpeg } from "@/lib/submissions-validation.mjs";

const HEADER_PROBE_BYTES = 2 * 1024 * 1024;

export class PreparePhotoError extends Error {
  readonly code: "photo_unreadable" | "photo_still_too_large";

  constructor(code: "photo_unreadable" | "photo_still_too_large") {
    super(code);
    this.name = "PreparePhotoError";
    this.code = code;
  }
}

/**
 * Deja la foto lista para el POST.
 * Un JPEG que ya cabe se devuelve sin recomprimir.
 * PNG, WebP y HEIC/HEIF se convierten si el navegador puede decodificarlos.
 */
export async function prepareSubmissionPhoto(file: File): Promise<File> {
  if (file.size < 1) throw new PreparePhotoError("photo_unreadable");

  const inspected = await inspectFile(file);
  if (
    inspected.layout &&
    shouldKeepOriginalJpeg({
      isJpeg: true,
      byteLength: file.size,
      width: inspected.layout.width,
      height: inspected.layout.height,
    })
  ) {
    return withJpegType(file);
  }

  const bitmap = await openBitmap(file, inspected.layout);
  try {
    // Si el SOF no se pudo leer, las dimensiones del bitmap deciden.
    // No usar el bitmap cuando ya se reescaló: parecería que el original cabe.
    const decodedKeepsOriginal =
      inspected.isJpeg &&
      inspected.layout === null &&
      shouldKeepOriginalJpeg({
        isJpeg: true,
        byteLength: file.size,
        width: bitmap.width,
        height: bitmap.height,
      });
    if (decodedKeepsOriginal) return withJpegType(file);

    const fitted = await shrinkToLimit({
      width: bitmap.width,
      height: bitmap.height,
      maxBytes: MAX_SUBMISSION_BYTES,
      encode: async (step) => {
        const blob = await renderJpeg(bitmap, step.width, step.height, step.quality);
        return { byteLength: blob.size, payload: blob };
      },
    });
    if (!fitted || !(fitted.payload instanceof Blob)) {
      throw new PreparePhotoError("photo_still_too_large");
    }
    return jpegFile(fitted.payload, file);
  } finally {
    bitmap.close();
  }
}

async function inspectFile(file: File): Promise<{
  isJpeg: boolean;
  layout: { width: number; height: number } | null;
}> {
  const probe = Math.min(file.size, file.size <= MAX_SUBMISSION_BYTES ? file.size : HEADER_PROBE_BYTES);
  const bytes = new Uint8Array(await file.slice(0, probe).arrayBuffer());
  const jpeg = isJpeg(bytes);
  return { isJpeg: jpeg, layout: jpeg ? readJpegLayout(bytes) : null };
}

function withJpegType(file: File): File {
  if (file.type === "image/jpeg" || file.type === "image/jpg") return file;
  return jpegFile(file, file);
}

async function openBitmap(
  file: File,
  layout: { width: number; height: number } | null,
): Promise<ImageBitmap> {
  const fitted =
    layout && Math.max(layout.width, layout.height) > MAX_LONG_EDGE
      ? fitLongEdge(layout.width, layout.height, MAX_LONG_EDGE)
      : null;
  const attempts: ImageBitmapOptions[] = [];
  if (fitted) {
    attempts.push({
      imageOrientation: "from-image",
      resizeWidth: fitted.width,
      resizeHeight: fitted.height,
      resizeQuality: "high",
    });
  }
  attempts.push({ imageOrientation: "from-image" });
  attempts.push({});

  for (const options of attempts) {
    try {
      return await createImageBitmap(file, options);
    } catch {
      // El siguiente intento quita resize u orientación y, al final, usa <img>.
    }
  }

  try {
    return await decodeWithImageElement(file);
  } catch {
    throw new PreparePhotoError("photo_unreadable");
  }
}

function decodeWithImageElement(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      createImageBitmap(image, { imageOrientation: "from-image" }).then(resolve, () => {
        createImageBitmap(image).then(resolve, reject);
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PreparePhotoError("photo_unreadable"));
    };
    image.src = url;
  });
}

function renderJpeg(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new PreparePhotoError("photo_unreadable"));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new PreparePhotoError("photo_unreadable"));
      },
      "image/jpeg",
      quality,
    );
  });
}

function jpegFile(contents: Blob, source: File): File {
  const base = source.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([contents], `${base}.jpg`, {
    type: "image/jpeg",
    lastModified: source.lastModified,
  });
}
