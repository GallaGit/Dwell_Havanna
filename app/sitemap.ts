import type { MetadataRoute } from "next";
import { listPublishedProperties, listPublishedPosts } from "@/lib/content";
import { canonicalFor } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, posts] = await Promise.all([
    listPublishedProperties(),
    listPublishedPosts(),
  ]);

  return [
    { url: canonicalFor("/"), changeFrequency: "weekly", priority: 1 },
    { url: canonicalFor("/properties"), changeFrequency: "weekly", priority: 0.8 },
    { url: canonicalFor("/journal"), changeFrequency: "weekly", priority: 0.8 },
    { url: canonicalFor("/about"), changeFrequency: "monthly", priority: 0.5 },
    ...properties.map((p) => ({
      url: canonicalFor(`/properties/${p.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: canonicalFor(`/journal/${p.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
