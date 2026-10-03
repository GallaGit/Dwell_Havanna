type SlugRecord = { slug: string };

export type EmbedSubject<
  TProperty extends SlugRecord = SlugRecord,
  TPost extends SlugRecord = SlugRecord,
> =
  | { kind: "property"; property: TProperty }
  | { kind: "post"; post: TPost };

/**
 * El embed publica properties y journal (`docs/Tech/02`, `docs/Idea/Fase-1-Cierre`).
 * Si un slug está en las dos listas, gana la property: el handler antiguo
 * consultaba properties primero.
 * Un slug de journal no se busca en `properties`.
 */
export function pickEmbedSubject<
  TProperty extends SlugRecord,
  TPost extends SlugRecord,
>(
  slug: string,
  properties: readonly TProperty[],
  posts: readonly TPost[],
): EmbedSubject<TProperty, TPost> | null {
  const property = properties.find((item) => item.slug === slug);
  if (property) return { kind: "property", property };
  const post = posts.find((item) => item.slug === slug);
  if (post) return { kind: "post", post };
  return null;
}

/** Params solo de los slugs que `pickEmbedSubject` puede renderizar. */
export function embedStaticParams(
  properties: readonly SlugRecord[],
  posts: readonly SlugRecord[],
): { slug: string }[] {
  const slugs = new Set<string>([
    ...properties.map((property) => property.slug),
    ...posts.map((post) => post.slug),
  ]);
  return [...slugs].map((slug) => ({ slug }));
}
