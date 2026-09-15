import { randomUUID } from "crypto";
import { getServiceClient } from "@/lib/db";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — decisión de fotos Fase 1
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg"]);
const BUCKET = "dwell-media";

function sanitizeHandle(handle: string): string {
  return handle
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

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

  if (!rawHandle || !caption) {
    return Response.json(
      { ok: false, error: "handle_and_caption_required" },
      { status: 422 }
    );
  }
  if (rights !== "true" && rights !== "on") {
    return Response.json(
      { ok: false, error: "rights_required" },
      { status: 422 }
    );
  }
  if (!(photo instanceof File) || photo.size === 0) {
    return Response.json({ ok: false, error: "photo_required" }, { status: 422 });
  }
  if (!ALLOWED_TYPES.has(photo.type.toLowerCase())) {
    return Response.json(
      { ok: false, error: "photo_must_be_jpeg" },
      { status: 422 }
    );
  }
  if (photo.size > MAX_BYTES) {
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
    .ilike("handle", handle)
    .maybeSingle();
  if (!contributor) {
    return Response.json(
      { ok: false, error: "unknown_contributor" },
      { status: 403 }
    );
  }

  const path = `submissions/${sanitizeHandle(handle)}/${randomUUID()}.jpg`;
  const bytes = Buffer.from(await photo.arrayBuffer());
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
