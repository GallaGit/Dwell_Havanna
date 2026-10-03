import { randomUUID } from "crypto";
import { getServiceClient } from "@/lib/db";
import { JpegProcessingError, stripJpegMetadata } from "@/lib/jpeg-metadata";
import { pendingObjectPath, PRIVATE_BUCKET } from "@/lib/submission-media.mjs";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  contentLengthExceeded,
  isJpeg,
  MAX_REQUEST_BYTES,
  readBodyWithLimit,
  validateSubmissionFields,
} from "@/lib/submissions-validation.mjs";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg"]);

function jsonError(error: string, status: number): Response {
  return Response.json({ ok: false, error }, { status });
}

/**
 * POST /api/submissions (multipart/form-data)
 * Campos: handle, title?, caption, rights=on/true, photo (JPEG ≤ 4 MB)
 * Solo colaboradores en verified_contributors. Guarda el JPEG ya sin EXIF
 * en el bucket privado y crea una fila pending. No publica.
 */
export async function POST(req: Request): Promise<Response> {
  const db = getServiceClient();
  if (!db) return jsonError("db_not_configured", 503);

  const supabase = await getSupabaseServerClient();
  if (!supabase) return jsonError("auth_not_configured", 503);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError("authentication_required", 401);

  if (contentLengthExceeded(req.headers.get("content-length"))) {
    return jsonError("body_too_large", 413);
  }

  const limited = await readBodyWithLimit(req.body, MAX_REQUEST_BYTES);
  if (!limited.ok) return jsonError("body_too_large", 413);

  const headers = new Headers(req.headers);
  headers.delete("content-length");
  let form: FormData;
  try {
    const body = new Uint8Array(limited.bytes);
    form = await new Request(req.url, {
      method: "POST",
      headers,
      body,
    }).formData();
  } catch {
    return jsonError("bad_form", 400);
  }

  const rawHandle = String(form.get("handle") ?? "").trim();
  const title = String(form.get("title") ?? "").trim().slice(0, 140);
  const caption = String(form.get("caption") ?? "").trim().slice(0, 2000);
  const rights = String(form.get("rights") ?? "").toLowerCase();
  const photo = form.get("photo");
  const photoSize = photo instanceof File ? photo.size : 0;

  const fieldError = validateSubmissionFields({
    handle: rawHandle,
    caption,
    rights,
    photoSize,
    photoBytes: undefined,
  });
  if (fieldError) return jsonError(fieldError, 422);
  if (!(photo instanceof File)) return jsonError("photo_required", 422);
  if (!ALLOWED_TYPES.has(photo.type.toLowerCase())) return jsonError("photo_must_be_jpeg", 422);

  const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
  const { data: contributor } = await db
    .from("verified_contributors")
    .select("handle")
    .eq("auth_user_id", user.id)
    .ilike("handle", handle)
    .maybeSingle();
  if (!contributor) return jsonError("unknown_contributor", 403);

  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!isJpeg(bytes)) return jsonError("photo_must_be_jpeg", 422);

  let clean: Buffer;
  try {
    clean = await stripJpegMetadata(bytes);
  } catch (error) {
    if (error instanceof JpegProcessingError) return jsonError(error.code, 422);
    return jsonError("photo_must_be_jpeg", 422);
  }

  const path = pendingObjectPath(randomUUID());
  if (!path) return jsonError("upload_failed", 500);

  const { error: uploadError } = await db.storage.from(PRIVATE_BUCKET).upload(path, clean, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (uploadError) return jsonError("upload_failed", 500);

  const captionRaw = title ? `${title}\n\n${caption}` : caption;
  const { data: row, error: insertError } = await db
    .from("submissions")
    .insert({
      author_handle: contributor.handle,
      image_url: path,
      caption_raw: captionRaw,
      source: "form",
      rights_granted: true,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    await db.storage.from(PRIVATE_BUCKET).remove([path]);
    return jsonError("save_failed", 500);
  }

  return Response.json({ ok: true, id: row.id });
}
