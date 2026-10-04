import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublishedContentClient, getPublishedFallbackClient } from "./db";
import { choosePublishedRow, choosePublishedRows, type ReadResult, type RowRead } from "./published-read";
import {
  properties as staticProperties,
  journalPosts as staticPosts,
  type Property,
  type JournalPost,
} from "./data";
import { journalPlaceholderParagraphs } from "./placeholders";

/**
 * Capa de contenido — Fase 1.
 * Lee de Supabase (solo `status = 'published'`), primero con la clave
 * publishable. Si esa lectura no devuelve filas o falla, repite el mismo
 * filtro con `service_role` (`getPublishedFallbackClient`, cacheable) hasta
 * que la policy `published_read` esté aplicada. Si no hay DB o la consulta
 * falla, cae a lib/data.ts. Una lista vacía confirmada no usa el estático.
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

function isDynamicServerError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

async function readList<T>(
  client: SupabaseClient | null,
  query: (client: SupabaseClient) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<ReadResult<T> | null> {
  if (!client) return null;
  try {
    const result = await query(client);
    if (result.error || !result.data) return { ok: false };
    return { ok: true, rows: result.data };
  } catch (error) {
    if (isDynamicServerError(error)) throw error;
    return { ok: false };
  }
}

async function readRow<T>(
  client: SupabaseClient | null,
  query: (client: SupabaseClient) => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<RowRead<T> | null> {
  if (!client) return null;
  try {
    const result = await query(client);
    if (result.error) return { ok: false };
    return { ok: true, row: result.data };
  } catch (error) {
    if (isDynamicServerError(error)) throw error;
    return { ok: false };
  }
}

async function publishedList<T>(
  query: (client: SupabaseClient) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[] | null> {
  const anon = await readList(getPublishedContentClient(), query);
  const service =
    anon?.ok && anon.rows.length > 0 ? null : await readList(getPublishedFallbackClient(), query);
  return choosePublishedRows(anon, service);
}

async function publishedRow<T>(
  query: (client: SupabaseClient) => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T | null | undefined> {
  const anon = await readRow(getPublishedContentClient(), query);
  const service = anon?.ok && anon.row ? null : await readRow(getPublishedFallbackClient(), query);
  return choosePublishedRow(anon, service);
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

function propertyQuery(db: SupabaseClient) {
  return db
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
}

function postQuery(db: SupabaseClient) {
  return db
    .from("journal_posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
}

export const listPublishedProperties = cache(async (): Promise<Property[]> => {
  try {
    const rows = await publishedList<PropertyRow>(propertyQuery);
    if (!rows) return staticProperties;
    return rows.map(toProperty);
  } catch {
    return staticProperties;
  }
});

export const getPropertyBySlug = cache(
  async (slug: string): Promise<Property | undefined> => {
    try {
      const row = await publishedRow<PropertyRow>((db) =>
        db
          .from("properties")
          .select(PROPERTY_COLUMNS)
          .eq("status", "published")
          .eq("slug", slug)
          .maybeSingle(),
      );
      if (row === undefined) return staticProperties.find((property) => property.slug === slug);
      if (!row) return undefined;
      return toProperty(row);
    } catch {
      return staticProperties.find((property) => property.slug === slug);
    }
  },
);

export const listPublishedPosts = cache(async (): Promise<JournalPost[]> => {
  try {
    const rows = await publishedList<JournalRow>(postQuery);
    if (!rows) return staticPosts;
    return rows.map(toPost);
  } catch {
    return staticPosts;
  }
});

export const getPostBySlug = cache(
  async (slug: string): Promise<JournalPost | undefined> => {
    try {
      const row = await publishedRow<JournalRow>((db) =>
        db
          .from("journal_posts")
          .select(POST_COLUMNS)
          .eq("status", "published")
          .eq("slug", slug)
          .maybeSingle(),
      );
      if (row === undefined) return staticPosts.find((post) => post.slug === slug);
      if (!row) return undefined;
      return toPost(row);
    } catch {
      return staticPosts.find((post) => post.slug === slug);
    }
  },
);
