import { getPropertyBySlug, getPostBySlug } from "@/lib/content";
import { canonicalFor } from "@/lib/site";

export const revalidate = 3600;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Embed ligero para sitios terceros: /embed/<slug>?utm_source=<partner>
 * Resuelve properties y journal. HTML standalone pensado para <iframe>.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  const post = property ? null : await getPostBySlug(slug);

  if (!property && !post) {
    return new Response("Not found", { status: 404 });
  }

  const title = property ? property.name : post!.title;
  const subtitle = property
    ? `${property.location} — ${property.character}`
    : `${post!.category} — ${post!.date}`;
  const image = property ? property.cover : post!.image;
  const url = property
    ? canonicalFor(`/properties/${property.slug}`)
    : canonicalFor(`/journal/${post!.slug}`);

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font-family:Georgia,serif;background:#faf8f4;color:#1a1a1a}a{color:inherit;text-decoration:none}img{display:block;width:100%;height:auto}.wrap{max-width:480px}.meta{padding:12px 14px}.kicker{font-family:Arial,sans-serif;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#777;margin:0 0 6px}.title{font-size:19px;line-height:1.25;margin:0 0 8px}.brand{font-family:Arial,sans-serif;font-size:11px;color:#777}.brand b{color:#1a1a1a}</style></head><body><a href="${esc(url)}" target="_blank" rel="noopener"><div class="wrap"><img src="${esc(image)}" alt="${esc(title)}" loading="lazy"><div class="meta"><p class="kicker">${esc(subtitle)}</p><p class="title">${esc(title)}</p><p class="brand">Vía <b>Dwell Havana</b> — guía editorial de arquitectura habanera</p></div></div></a></body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
