/**
 * Política de preparación de la foto, sin DOM.
 * El navegador la aplica en lib/prepare-submission-photo-browser.ts.
 * Un JPEG que ya mide ≤ 4 MB y cuyo lado largo mide ≤ 2560 px se envía
 * sin recomprimir. El resto se escala y se exporta a JPEG.
 * El servidor sigue rechazando lo que no sea JPEG dentro de sus topes.
 */
import { isJpeg, MAX_SUBMISSION_BYTES } from "./submissions-validation.mjs";

export { MAX_SUBMISSION_BYTES };

/** Lado largo máximo que el formulario produce antes de enviar. */
export const MAX_LONG_EDGE = 2560;

/** De mayor a menor. La primera que quepa en 4 MB es la que se envía. */
export const JPEG_QUALITIES = [0.92, 0.84, 0.76, 0.68, 0.6, 0.5];

const EDGE_LADDER = [MAX_LONG_EDGE, 2048, 1600, 1280, 1024, 800];

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/**
 * @param {number} width
 * @param {number} height
 * @param {number} maxEdge
 * @returns {{ width: number, height: number }}
 */
export function fitLongEdge(width, height, maxEdge) {
  const long = Math.max(width, height);
  if (long <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / long;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Tamaños a probar, de mayor a menor, sin ampliar y sin repetir el mismo lado largo.
 * @param {number} width
 * @param {number} height
 * @returns {{ width: number, height: number }[]}
 */
export function scaleSteps(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) return [];
  const long = Math.max(width, height);
  const steps = [];
  let previousLong = Infinity;
  for (const edge of EDGE_LADDER) {
    const target = Math.min(long, edge);
    if (target >= previousLong) continue;
    previousLong = target;
    steps.push(fitLongEdge(width, height, target));
  }
  return steps;
}

/**
 * @param {{ isJpeg: boolean, byteLength: number, width: number, height: number }} photo
 */
export function shouldKeepOriginalJpeg(photo) {
  if (!photo.isJpeg) return false;
  if (!Number.isFinite(photo.byteLength) || photo.byteLength < 1) return false;
  if (photo.byteLength > MAX_SUBMISSION_BYTES) return false;
  if (!Number.isFinite(photo.width) || !Number.isFinite(photo.height)) return false;
  if (photo.width < 1 || photo.height < 1) return false;
  return Math.max(photo.width, photo.height) <= MAX_LONG_EDGE;
}

/**
 * Baja la calidad y, si hace falta, el lado largo, hasta que `encode` quepa.
 * @param {{
 *   width: number,
 *   height: number,
 *   maxBytes: number,
 *   encode: (step: { width: number, height: number, quality: number }) => Promise<{ byteLength: number, payload: unknown }>,
 * }} args
 * @returns {Promise<{ width: number, height: number, quality: number, payload: unknown } | null>}
 */
export async function shrinkToLimit({ width, height, maxBytes, encode }) {
  for (const size of scaleSteps(width, height)) {
    for (const quality of JPEG_QUALITIES) {
      const encoded = await encode({ width: size.width, height: size.height, quality });
      if (encoded.byteLength <= maxBytes) {
        return { width: size.width, height: size.height, quality, payload: encoded.payload };
      }
    }
  }
  return null;
}

/**
 * Dimensiones ya orientadas de un JPEG. Null si no se puede leer el SOF.
 * La miniatura embebida en APP1 no cuenta: solo se leen marcadores de primer nivel.
 * @param {Uint8Array} bytes
 * @returns {{ width: number, height: number } | null}
 */
export function readJpegLayout(bytes) {
  if (!(bytes instanceof Uint8Array) || !isJpeg(bytes)) return null;
  let offset = 2;
  let orientation = 1;
  let width = 0;
  let height = 0;

  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd8) continue;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 1 >= bytes.length) return null;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;

    if (marker === 0xe1) {
      orientation = readExifOrientation(bytes.subarray(offset + 2, offset + segmentLength));
    } else if (SOF_MARKERS.has(marker)) {
      if (segmentLength < 7) return null;
      height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      width = (bytes[offset + 5] << 8) | bytes[offset + 6];
    }
    offset += segmentLength;
  }

  if (width < 1 || height < 1) return null;
  if (orientation >= 5 && orientation <= 8) return { width: height, height: width };
  return { width, height };
}

/**
 * @param {Uint8Array} segment APP1 sin los dos bytes de longitud
 * @returns {number}
 */
function readExifOrientation(segment) {
  if (segment.length < 16) return 1;
  if (
    segment[0] !== 0x45 ||
    segment[1] !== 0x78 ||
    segment[2] !== 0x69 ||
    segment[3] !== 0x66 ||
    segment[4] !== 0 ||
    segment[5] !== 0
  ) {
    return 1;
  }

  const tiff = 6;
  const little = segment[tiff] === 0x49 && segment[tiff + 1] === 0x49;
  const big = segment[tiff] === 0x4d && segment[tiff + 1] === 0x4d;
  if (!little && !big) return 1;

  const u16 = (at) => {
    if (at < 0 || at + 1 >= segment.length) return null;
    return little ? segment[at] | (segment[at + 1] << 8) : (segment[at] << 8) | segment[at + 1];
  };
  const u32 = (at) => {
    if (at < 0 || at + 3 >= segment.length) return null;
    return little
      ? (segment[at] |
          (segment[at + 1] << 8) |
          (segment[at + 2] << 16) |
          (segment[at + 3] << 24)) >>>
          0
      : ((segment[at] << 24) |
          (segment[at + 1] << 16) |
          (segment[at + 2] << 8) |
          segment[at + 3]) >>>
          0;
  };

  if (u16(tiff + 2) !== 0x002a) return 1;
  const ifdOffset = u32(tiff + 4);
  if (ifdOffset == null) return 1;
  const ifd = tiff + ifdOffset;
  const count = u16(ifd);
  if (count == null || count > 64) return 1;

  for (let index = 0; index < count; index += 1) {
    const entry = ifd + 2 + index * 12;
    const tag = u16(entry);
    if (tag == null) return 1;
    if (tag !== 0x0112) continue;
    const type = u16(entry + 2);
    const value = u16(entry + 8);
    if (type !== 3 || value == null || value < 1 || value > 8) return 1;
    return value;
  }
  return 1;
}
