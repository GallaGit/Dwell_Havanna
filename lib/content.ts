import { cache } from "react";
import { getPublishedContentClient } from "./db";
import {
  properties as staticProperties,
  journalPosts as staticPosts,
  type Property,
  type JournalPost,
} from "./data";
import { journalPlaceholderParagraphs } from "./placeholders";

/**
 * Capa de contenido — Fase 1.
 * Lee de Supabase (solo `status = 'published'`); si no hay DB configurada
 * o la consulta falla, cae al dataset estático de lib/data.ts.
 * Misma forma que antes: las páginas no cambian de props.
 *
 * `cache()` deduplica la lectura dentro de la misma petición
 * (`generateMetadata` y la página).
 */

const PROPERTY_COLUMNS =
  "slug,name,location,character,description,cover,images,facts,architecture,interior,story";
const POST_COLUMNS = "slug,title,category,excerpt,image,date_label,reading_time";

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
    body: journalPlaceholderParagraphs,
  };
}

export const listPublishedProperties = cache(async (): Promise<Property[]> => {
  try {
    const db = getPublishedContentClient();
    if (!db) return staticProperties;
    const { data, error } = await db
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return staticProperties;
    return (data as PropertyRow[]).map(toProperty);
  } catch {
    return staticProperties;
  }
});

export const getPropertyBySlug = cache(
  async (slug: string): Promise<Property | undefined> => {
    try {
      const db = getPublishedContentClient();
      if (!db) return staticProperties.find((property) => property.slug === slug);
      const { data, error } = await db
        .from("properties")
        .select(PROPERTY_COLUMNS)
        .eq("status", "published")
        .eq("slug", slug)
        .maybeSingle();
      if (error) return staticProperties.find((property) => property.slug === slug);
      if (!data) return undefined;
      return toProperty(data as PropertyRow);
    } catch {
      return staticProperties.find((property) => property.slug === slug);
    }
  },
);

export const listPublishedPosts = cache(async (): Promise<JournalPost[]> => {
  try {
    const db = getPublishedContentClient();
    if (!db) return staticPosts;
    const { data, error } = await db
      .from("journal_posts")
      .select(POST_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return staticPosts;
    return (data as JournalRow[]).map(toPost);
  } catch {
    return staticPosts;
  }
});

export const getPostBySlug = cache(
  async (slug: string): Promise<JournalPost | undefined> => {
    try {
      const db = getPublishedContentClient();
      if (!db) return staticPosts.find((post) => post.slug === slug);
      const { data, error } = await db
        .from("journal_posts")
        .select(POST_COLUMNS)
        .eq("status", "published")
        .eq("slug", slug)
        .maybeSingle();
      if (error) return staticPosts.find((post) => post.slug === slug);
      if (!data) return undefined;
      return toPost(data as JournalRow);
    } catch {
      return staticPosts.find((post) => post.slug === slug);
    }
  },
);
