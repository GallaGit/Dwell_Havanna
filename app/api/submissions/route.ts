import { randomUUID } from "crypto";
import { getServiceClient } from "@/lib/db";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  isJpeg,
  sanitizeHandle,
  validateSubmissionFields,
} from "@/lib/submissions-validation.mjs";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg"]);
const BUCKET = "dwell-media";

/**
 * POST /api/submissions (multipart/form-data)
 * Campos: handle, title?, caption, rights=on/true, photo (JPEG ≤ 8MB)
 * Solo colaboradores en verified_contributors. Guarda original en Storage
 * y crea fila pending — NUNCA publica directo (moderación en /admin/review).
 */
export async function POST(req: Request): Promise<Response> {
  const db = getServiceClient();
  if (!db) {
    return Response.json(
      { ok: false, error: "db_not_configured" },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return Response.json({ ok: false, error: "auth_not_configured" }, { status: 503 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: "bad_form" }, { status: 400 });
  }

  const rawHandle = String(form.get("handle") ?? "").trim();
  const title = String(form.get("title") ?? "").trim().slice(0, 140);
  const caption = String(form.get("caption") ?? "").trim().slice(0, 2000);
  const rights = String(form.get("rights") ?? "").toLowerCase();
  const photo = form.get("photo");
  const bytes = photo instanceof File
    ? Buffer.from(new Uint8Array(await photo.arrayBuffer()))
    : Buffer.alloc(0);
  const validationError = validateSubmissionFields({
    handle: rawHandle,
    caption,
    rights,
    photoSize: photo instanceof File ? photo.size : 0,
    photoBytes: bytes,
  });

  if (validationError === "handle_and_caption_required") {
    return Response.json(
      { ok: false, error: "handle_and_caption_required" },
      { status: 422 }
    );
  }
  if (validationError === "rights_required") {
    return Response.json(
      { ok: false, error: "rights_required" },
      { status: 422 }
    );
  }
  if (validationError === "photo_required") {
    return Response.json({ ok: false, error: "photo_required" }, { status: 422 });
  }
  if (!(photo instanceof File)) {
    return Response.json({ ok: false, error: "photo_required" }, { status: 422 });
  }
  if (!ALLOWED_TYPES.has(photo.type.toLowerCase())) {
    return Response.json(
      { ok: false, error: "photo_must_be_jpeg" },
      { status: 422 }
    );
  }
  if (validationError === "photo_too_large_8mb") {
    return Response.json(
      { ok: false, error: "photo_too_large_8mb" },
      { status: 422 }
    );
  }

  // Allowlist: ¿es colaborador verificado?
  const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
  const { data: contributor } = await db
    .from("verified_contributors")
    .select("handle")
    .eq("auth_user_id", user.id)
    .ilike("handle", handle)
    .maybeSingle();
  if (!contributor) {
    return Response.json(
      { ok: false, error: "unknown_contributor" },
      { status: 403 }
    );
  }

  const path = `submissions/${sanitizeHandle(handle)}/${randomUUID()}.jpg`;
  if (validationError === "photo_must_be_jpeg" || !isJpeg(bytes)) {
    return Response.json(
      { ok: false, error: "photo_must_be_jpeg" },
      { status: 422 }
    );
  }
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (uploadError) {
    return Response.json(
      { ok: false, error: "upload_failed" },
      { status: 500 }
    );
  }

  const { data: publicUrl } = db.storage.from(BUCKET).getPublicUrl(path);
  const captionRaw = title ? `${title}\n\n${caption}` : caption;

  const { data: row, error: insertError } = await db
    .from("submissions")
    .insert({
      author_handle: contributor.handle,
      image_url: publicUrl.publicUrl,
      caption_raw: captionRaw,
      source: "form",
      rights_granted: true,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    // Limpieza best-effort del archivo huérfano
    await db.storage.from(BUCKET).remove([path]);
    return Response.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return Response.json({ ok: true, id: row.id });
}
