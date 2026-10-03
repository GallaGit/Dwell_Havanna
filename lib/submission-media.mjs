/** Buckets y rutas de las fotos de envíos. */

export const PRIVATE_BUCKET = "dwell-media";
export const PUBLISHED_BUCKET = "dwell-published";
/** El panel firma la foto pendiente en cada carga. 15 minutos cubre la revisión. */
export const SIGNED_URL_TTL_SECONDS = 15 * 60;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_JPG = `${UUID}\\.jpg`;
const UUID_PATTERN = new RegExp(`^${UUID}$`, "i");
const UUID_JPG_PATTERN = new RegExp(`^${UUID_JPG}$`, "i");
const PENDING_PATTERN = new RegExp(`^submissions/(?:[a-z0-9-]{1,40}/)?(${UUID_JPG})$`, "i");

function unsafePath(value) {
  return (
    value.includes("..") ||
    value.includes("\\") ||
    value.includes("//") ||
    /%2e/i.test(value) ||
    value.includes("\0")
  );
}

/**
 * Ruta de un envío nuevo. Solo el UUID: el handle no entra en el objeto.
 * @param {string} fileId
 * @returns {string | null}
 */
export function pendingObjectPath(fileId) {
  if (typeof fileId !== "string" || !UUID_PATTERN.test(fileId)) return null;
  return `submissions/${fileId}.jpg`;
}

/**
 * @param {string} value
 * @param {string} marker
 * @returns {string | null}
 */
function objectPathAfter(value, marker) {
  const at = value.indexOf(marker);
  if (at === -1) return null;
  try {
    return decodeURIComponent(value.slice(at + marker.length).split("?")[0]);
  } catch {
    return null;
  }
}

/**
 * @param {string} imageRef
 * @returns {{ bucket: string, path: string } | null}
 */
export function locateStoredObject(imageRef) {
  if (typeof imageRef !== "string") return null;
  const value = imageRef.trim();
  if (!value || value.length > 2048) return null;

  const publishedPath = objectPathAfter(value, "/dwell-published/");
  if (publishedPath) {
    if (unsafePath(publishedPath) || !UUID_JPG_PATTERN.test(publishedPath)) return null;
    return { bucket: PUBLISHED_BUCKET, path: publishedPath };
  }

  const fromUrl = objectPathAfter(value, "/dwell-media/");
  const path = fromUrl ?? value;
  if (!path || unsafePath(path)) return null;

  const pending = PENDING_PATTERN.exec(path);
  if (!pending) return null;
  return { bucket: PRIVATE_BUCKET, path };
}

/**
 * Objeto a borrar al rechazar. Solo originales privados, nunca la copia publicada.
 * @param {string} imageRef
 * @returns {{ bucket: string, path: string } | null}
 */
export function removalTarget(imageRef) {
  const located = locateStoredObject(imageRef);
  if (!located || located.bucket !== PRIVATE_BUCKET) return null;
  if (!located.path.startsWith("submissions/")) return null;
  return located;
}

/**
 * Copia que se publica al aprobar. El nombre es el UUID, sin handle ni carpeta.
 * @param {string} imageRef
 * @returns {{ fromBucket: string, fromPath: string, toBucket: string, toPath: string } | null}
 */
export function publishTarget(imageRef) {
  const located = locateStoredObject(imageRef);
  if (!located || located.bucket !== PRIVATE_BUCKET) return null;
  const file = located.path.split("/").pop();
  if (!file || !UUID_JPG_PATTERN.test(file)) return null;
  return {
    fromBucket: PRIVATE_BUCKET,
    fromPath: located.path,
    toBucket: PUBLISHED_BUCKET,
    toPath: file,
  };
}

/**
 * Plan de una fila ya guardada, para el script de migración. No toca la red.
 * @param {string} status
 * @param {string} imageRef
 */
export function planSubmissionObject(status, imageRef) {
  const located = locateStoredObject(imageRef);
  if (!located) return { action: "skip", reason: "unrecognized_path" };

  if (status === "rejected") {
    if (located.bucket !== PRIVATE_BUCKET) return { action: "skip", reason: "not_private" };
    return { action: "delete", bucket: located.bucket, path: located.path };
  }

  if (status === "pending") {
    const file = located.path.split("/").pop();
    const target = `submissions/${file}`;
    if (located.bucket === PRIVATE_BUCKET && located.path === target) {
      return { action: "keep", bucket: located.bucket, path: located.path };
    }
    if (located.bucket !== PRIVATE_BUCKET) return { action: "skip", reason: "not_private" };
    return {
      action: "move",
      bucket: PRIVATE_BUCKET,
      from: located.path,
      to: target,
      imageUrl: target,
    };
  }

  if (status === "approved") {
    const file = located.path.split("/").pop();
    if (!file || !UUID_JPG_PATTERN.test(file)) return { action: "skip", reason: "unrecognized_path" };
    if (located.bucket === PUBLISHED_BUCKET && located.path === file) {
      return { action: "keep", bucket: located.bucket, path: located.path };
    }
    return {
      action: "republish",
      fromBucket: located.bucket,
      fromPath: located.path,
      toBucket: PUBLISHED_BUCKET,
      toPath: file,
    };
  }

  return { action: "skip", reason: "unknown_status" };
}
