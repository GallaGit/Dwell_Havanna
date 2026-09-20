export const MAX_SUBMISSION_BYTES = 8 * 1024 * 1024;

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

export function validateSubmissionFields({ handle, caption, rights, photoSize, photoBytes }) {
  if (!handle || !caption) return "handle_and_caption_required";
  if (rights !== "true" && rights !== "on") return "rights_required";
  if (!photoSize) return "photo_required";
  if (photoSize > MAX_SUBMISSION_BYTES) return "photo_too_large_8mb";
  if (!isJpeg(photoBytes)) return "photo_must_be_jpeg";
  return null;
}
