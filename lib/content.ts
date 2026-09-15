import { getServiceClient } from "./db";
import {
  properties as staticProperties,
  journalPosts as staticPosts,
  type Property,
  type JournalPost,
} from "./data";

/**
 * Capa de contenido — Fase 1.
 * Lee de Supabase (solo `status = 'published'`); si no hay DB configurada
 * o la consulta falla, cae al dataset estático de lib/data.ts.
 * Misma forma que antes: las páginas no cambian de props.
 */

type PropertyRow = {
  slug: string;
  name: string;
  location: string;
  character: string;
  description: string;
  cover: string;
  images: string[];
  facts: { label: string; value: string }[];
  architecture: string;
  interior: string;
  story: string;
};

type JournalRow = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  date_label: string;
  reading_time: string;
};

function toProperty(row: PropertyRow): Property {
  return {
    slug: row.slug,
    name: row.name,
    location: row.location,
    character: row.character,
    description: row.description,
    cover: row.cover,
    images: row.images ?? [],
    facts: row.facts ?? [],
    architecture: row.architecture,
    interior: row.interior,
    story: row.story,
  };
}

function toPost(row: JournalRow): JournalPost {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    image: row.image,
    date: row.date_label,
    readingTime: row.reading_time,
  };
}

export async function listPublishedProperties(): Promise<Property[]> {
  try {
    const db = getServiceClient();
    if (!db) return staticProperties;
    const { data, error } = await db
      .from("properties")
      .select(
        "slug,name,location,character,description,cover,images,facts,architecture,interior,story"
      )
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return staticProperties;
    return (data as PropertyRow[]).map(toProperty);
  } catch {
    return staticProperties;
  }
}

export async function getPropertyBySlug(
  slug: string
): Promise<Property | undefined> {
  const all = await listPublishedProperties();
  return all.find((p) => p.slug === slug);
}

export async function listPublishedPosts(): Promise<JournalPost[]> {
  try {
    const db = getServiceClient();
    if (!db) return staticPosts;
    const { data, error } = await db
      .from("journal_posts")
      .select("slug,title,category,excerpt,image,date_label,reading_time")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return staticPosts;
    return (data as JournalRow[]).map(toPost);
  } catch {
    return staticPosts;
  }
}

export async function getPostBySlug(
  slug: string
): Promise<JournalPost | undefined> {
  const all = await listPublishedPosts();
  return all.find((p) => p.slug === slug);
}
