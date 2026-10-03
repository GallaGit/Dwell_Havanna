/**
 * Vercel corta el cuerpo de una función hacia 4,5 MB (Hobby y Pro).
 * La foto queda en 4 MB para que el multipart (campos y boundaries) quepa.
 */
export const MAX_REQUEST_BYTES = 4_718_592;
export const MAX_SUBMISSION_BYTES = 4 * 1024 * 1024;

export function sanitizeHandle(handle) {
  return handle
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function isJpeg(bytes) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/**
 * Rechaza un Content-Length por encima del tope antes de leer el cuerpo.
 * Un valor ausente no se rechaza aquí: el stream se corta aparte.
 * Un valor que no es un entero se rechaza.
 * @param {string | null | undefined} headerValue
 */
export function contentLengthExceeded(headerValue) {
  if (headerValue == null) return false;
  const raw = String(headerValue).trim();
  if (raw === "") return false;
  if (!/^\d+$/.test(raw)) return true;
  return Number(raw) > MAX_REQUEST_BYTES;
}

/**
 * Lee el cuerpo y corta en cuanto supera el tope. No acumula el resto.
 * @param {ReadableStream<Uint8Array> | null | undefined} body
 * @param {number} maxBytes
 * @returns {Promise<{ ok: true, bytes: Uint8Array } | { ok: false, error: "body_too_large" }>}
 */
export async function readBodyWithLimit(body, maxBytes) {
  if (!body) return { ok: true, bytes: new Uint8Array() };
  const reader = body.getReader();
  const chunks = [];
  let total = 0;
  let tooLarge = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const size = value?.byteLength ?? 0;
      if (total + size > maxBytes) {
        tooLarge = true;
        break;
      }
      if (size > 0) {
        chunks.push(value);
        total += size;
      }
    }
  } finally {
    if (tooLarge) {
      try {
        await reader.cancel();
      } catch {
        // El stream ya estaba cancelado.
      }
    }
    try {
      reader.releaseLock();
    } catch {
      // cancel() puede haber soltado el lock.
    }
  }
  if (tooLarge) return { ok: false, error: "body_too_large" };

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

export function validateSubmissionFields({ handle, caption, rights, photoSize, photoBytes }) {
  if (!handle || !caption) return "handle_and_caption_required";
  if (rights !== "true" && rights !== "on") return "rights_required";
  if (!photoSize) return "photo_required";
  if (photoSize > MAX_SUBMISSION_BYTES) return "photo_too_large";
  if (photoBytes != null && !isJpeg(photoBytes)) return "photo_must_be_jpeg";
  return null;
}
