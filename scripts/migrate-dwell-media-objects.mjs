#!/usr/bin/env node
/**
 * Mueve las fotos ya guardadas al modelo privado.
 *
 * Dry-run por defecto: lista el plan y no escribe. No lo ejecutes contra
 * un proyecto real desde un agente. El ref de producción queda bloqueado
 * salvo --allow-production.
 *
 *   node --experimental-strip-types scripts/migrate-dwell-media-objects.mjs
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node --experimental-strip-types scripts/migrate-dwell-media-objects.mjs --apply
 *
 * Pendiente en submissions/<handle>/<uuid>.jpg
 *   → se mueve a submissions/<uuid>.jpg dentro de dwell-media.
 * Aprobado
 *   → se reencodea sin EXIF y se copia a dwell-published/<uuid>.jpg.
 *     Se actualizan submissions.image_url y el journal que aún apunte
 *     a la URL vieja. Luego se borra el original.
 * Rechazado
 *   → se borra el objeto. La fila se queda, con la URL ya inservible.
 *
 * Si la ruta no cambia, la fila se deja como está.
 */
import { createClient } from "@supabase/supabase-js";
import { stripJpegMetadata } from "../lib/jpeg-metadata.ts";
import {
  planSubmissionObject,
  PUBLISHED_BUCKET,
} from "../lib/submission-media.mjs";

const PRODUCTION_REF = "sfujmwumtzuzwwhfmyxa";

function argHas(flag) {
  return process.argv.includes(flag);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Falta ${name}. No se hace nada.`);
    process.exit(1);
  }
  return value;
}

async function listSubmissions(db) {
  const rows = [];
  const pageSize = 200;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("submissions")
      .select("id,status,image_url")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function updateJournalImage(db, row, oldUrl, publicUrl) {
  const { error: byUrl } = await db
    .from("journal_posts")
    .update({ image: publicUrl })
    .eq("image", oldUrl);
  if (byUrl) throw byUrl;

  const slug = `community-${row.id.slice(0, 8)}`;
  const { data: post, error: lookupError } = await db
    .from("journal_posts")
    .select("slug,image")
    .eq("slug", slug)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!post) return;
  const image = post.image ?? "";
  if (image !== oldUrl && !image.includes("/dwell-media/")) return;
  const { error } = await db.from("journal_posts").update({ image: publicUrl }).eq("slug", slug);
  if (error) throw error;
}

async function applyPlan(db, row, plan) {
  if (plan.action === "delete") {
    const { error } = await db.storage.from(plan.bucket).remove([plan.path]);
    if (error) throw error;
    return;
  }

  if (plan.action === "move") {
    const { error } = await db.storage.from(plan.bucket).move(plan.from, plan.to);
    if (error) throw error;
    const { error: updateError } = await db
      .from("submissions")
      .update({ image_url: plan.imageUrl })
      .eq("id", row.id);
    if (updateError) throw updateError;
    return;
  }

  if (plan.action === "republish") {
    const downloaded = await db.storage.from(plan.fromBucket).download(plan.fromPath);
    if (downloaded.error || !downloaded.data) {
      throw downloaded.error ?? new Error(`No se pudo leer ${plan.fromPath}`);
    }
    const clean = await stripJpegMetadata(new Uint8Array(await downloaded.data.arrayBuffer()));
    const { error: uploadError } = await db.storage
      .from(plan.toBucket)
      .upload(plan.toPath, clean, { contentType: "image/jpeg", upsert: false });
    if (uploadError) throw uploadError;
    const { data: published } = db.storage.from(PUBLISHED_BUCKET).getPublicUrl(plan.toPath);
    const { error: submissionError } = await db
      .from("submissions")
      .update({ image_url: published.publicUrl })
      .eq("id", row.id);
    if (submissionError) throw submissionError;
    await updateJournalImage(db, row, row.image_url, published.publicUrl);
    if (plan.fromBucket !== plan.toBucket || plan.fromPath !== plan.toPath) {
      const { error: removeError } = await db.storage.from(plan.fromBucket).remove([plan.fromPath]);
      if (removeError) throw removeError;
    }
  }
}

async function main() {
  if (argHas("-h") || argHas("--help")) {
    console.log("Uso: node --experimental-strip-types scripts/migrate-dwell-media-objects.mjs [--apply] [--allow-production]");
    console.log("Sin --apply solo imprime el plan.");
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("Falta NEXT_PUBLIC_SUPABASE_URL. No se hace nada.");
    process.exit(1);
  }
  if (supabaseUrl.includes(PRODUCTION_REF) && !argHas("--allow-production")) {
    console.error(`La URL apunta al proyecto de producción (${PRODUCTION_REF}).`);
    console.error("No se hace nada. Repite con --allow-production solo si esa base es la correcta.");
    process.exit(1);
  }
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const apply = argHas("--apply");
  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = await listSubmissions(db);
  let failed = 0;
  for (const row of rows) {
    const plan = planSubmissionObject(row.status, row.image_url);
    const line = { id: row.id, status: row.status, plan };
    if (!apply || plan.action === "keep" || plan.action === "skip") {
      console.log(JSON.stringify(line));
      continue;
    }
    try {
      await applyPlan(db, row, plan);
      console.log(JSON.stringify({ ...line, applied: true }));
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "error";
      console.error(JSON.stringify({ ...line, applied: false, error: message }));
    }
  }

  if (!apply) {
    console.log("Dry-run. Nada se ha escrito. Repite con --apply para ejecutarlo.");
  }
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
