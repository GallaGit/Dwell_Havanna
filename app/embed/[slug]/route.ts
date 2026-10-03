import { listPublishedPosts, listPublishedProperties } from "@/lib/content";
import { embedStaticParams, pickEmbedSubject } from "@/lib/embed";
import { deliveryImageUrl } from "@/lib/image-delivery";
import { canonicalFor } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const [properties, posts] = await Promise.all([
    listPublishedProperties(),
    listPublishedPosts(),
  ]);
  return embedStaticParams(properties, posts);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Embed ligero para sitios terceros: /embed/<slug>?utm_source=<partner>
 * Renderiza una property publicada o un post del journal.
 * El slug sale de la lista de su tabla (`properties` o `journal_posts`):
 * un slug de journal no se consulta en `properties`.
 * HTML standalone pensado para <iframe>. 404 si no está publicado.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  const [properties, posts] = await Promise.all([
    listPublishedProperties(),
    listPublishedPosts(),
  ]);
  const subject = pickEmbedSubject(slug, properties, posts);

  if (!subject) {
    return new Response("Not found", { status: 404 });
  }

  const title = subject.kind === "property" ? subject.property.name : subject.post.title;
  const subtitle =
    subject.kind === "property"
      ? `${subject.property.location} — ${subject.property.character}`
      : `${subject.post.category} — ${subject.post.date}`;
  const image = deliveryImageUrl(
    subject.kind === "property" ? subject.property.cover : subject.post.image,
  );
  const url =
    subject.kind === "property"
      ? canonicalFor(`/properties/${subject.property.slug}`)
      : canonicalFor(`/journal/${subject.post.slug}`);

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font-family:Georgia,serif;background:#faf8f4;color:#1a1a1a}a{color:inherit;text-decoration:none}img{display:block;width:100%;height:auto}.wrap{max-width:480px}.meta{padding:12px 14px}.kicker{font-family:Arial,sans-serif;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#6f685e;margin:0 0 6px}.title{font-size:19px;line-height:1.25;margin:0 0 8px}.brand{font-family:Arial,sans-serif;font-size:11px;color:#6f685e}.brand b{color:#1a1a1a}</style></head><body><a href="${esc(url)}" target="_blank" rel="noopener"><div class="wrap"><img src="${esc(image)}" alt="${esc(title)}" width="1200" height="800" loading="lazy"><div class="meta"><p class="kicker">${esc(subtitle)}</p><p class="title">${esc(title)}</p><p class="brand">Vía <b>Dwell Havana</b> — guía editorial de arquitectura habanera</p></div></div></a></body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=31532400",
    },
  });
}
