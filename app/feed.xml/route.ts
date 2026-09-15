import { listPublishedProperties, listPublishedPosts } from "@/lib/content";
import { canonicalFor, siteUrl } from "@/lib/site";

export const revalidate = 3600;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(): Promise<Response> {
  const [properties, posts] = await Promise.all([
    listPublishedProperties(),
    listPublishedPosts(),
  ]);

  const items = [
    ...posts.map((p) => ({
      title: p.title,
      description: p.excerpt,
      url: canonicalFor(`/journal/${p.slug}`),
      image: p.image,
      category: p.category,
    })),
    ...properties.map((p) => ({
      title: `${p.name} — ${p.location}`,
      description: p.description,
      url: canonicalFor(`/properties/${p.slug}`),
      image: p.cover,
      category: "Property",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Dwell Havana — Journal &amp; Homes</title>
    <link>${esc(siteUrl)}</link>
    <description>An editorial guide to Havana&apos;s architecture, design and distinctive homes.</description>
    <language>en</language>${items
      .map(
        (i) => `
    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.url)}</link>
      <guid>${esc(i.url)}</guid>
      <description>${esc(i.description)}</description>
      <category>${esc(i.category)}</category>
      <media:content url="${esc(i.image)}" medium="image" />
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
