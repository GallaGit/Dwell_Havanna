/**
 * PLACEHOLDER — contenido de ejemplo, no el material definitivo.
 *
 * Aquí viven las fotos de stock, el cuerpo repetido de los posts y el email
 * de contacto de prueba. Cómo sustituirlos: docs/PRODUCT/contenido-placeholder.md
 *
 * El texto editorial de properties y journal (títulos, excerpts, fichas) sigue
 * en lib/data.ts y, si se usa la base de datos, en supabase/02-seed.sql.
 * Esos dos archivos también son de ejemplo.
 */

export const PLACEHOLDER_CONTACT_EMAIL = "hola@dwellhavana.example";

/** Email público. Definir NEXT_PUBLIC_CONTACT_EMAIL cuando exista el buzón real. */
export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || PLACEHOLDER_CONTACT_EMAIL;

export function contactMailto(): string {
  return `mailto:${contactEmail}`;
}

/** Foto de Unsplash usada solo como relleno. El id es el path `photo-…`. */
export function placeholderImage(id: string, width = 1600): string {
  return `https://images.unsplash.com/${id}?q=80&w=${width}&auto=format&fit=crop`;
}

export const placeholderPhoto = {
  casaMiramar: "photo-1600585154340-be6161a56a0c",
  casaMiramarInterior: "photo-1600607687939-ce8a6c25118c",
  casaMiramarRoom: "photo-1600566753086-00f18fb6b3ea",
  casaMiramarDetail: "photo-1502005229762-cf1b2da7c5d6",
  vedado: "photo-1522708323590-d24dbb6b0267",
  vedadoLiving: "photo-1502672260266-1c1ef2d93688",
  vedadoRoom: "photo-1493809842364-78817add7ffb",
  colon: "photo-1512917774080-9991f1c4c750",
  colonGallery: "photo-1533090161767-e6ffed986c88",
  colonRoom: "photo-1505691938895-1758d7feb511",
  journalLight: "photo-1600210492486-724fe5c67fb0",
  journalTerrazzo: "photo-1600607687920-4e2a09cf159d",
  journalPatio: "photo-1600566752355-35792bedcfea",
  journalPeople: "photo-1504307651254-35680f356dfd",
  havanaTexture: "photo-1503174971373-b1f69850bded",
  havanaStreet: "photo-1536500152107-01ab1422f932",
} as const;

/** Estudios de la portada (sección Havana). Sustituir src, alt y caption juntos. */
export const havanaStudies = [
  {
    src: placeholderImage(placeholderPhoto.havanaTexture, 800),
    alt: "Texture — Lime and time",
    caption: "Texture — Lime and time",
    frame: "col-span-6 md:col-span-3",
    aspect: "aspect-[3/4]",
    sizes: "(max-width: 768px) 50vw, 25vw",
    width: 800,
    height: 1066,
  },
  {
    src: placeholderImage(placeholderPhoto.havanaStreet, 1200),
    alt: "Context — Street as room",
    caption: "Context — Street as room",
    frame: "col-span-6 md:col-span-5 md:mt-16",
    aspect: "aspect-[4/3]",
    sizes: "(max-width: 768px) 50vw, 42vw",
    width: 1200,
    height: 900,
  },
] as const;

/**
 * Cuerpo que hoy comparten todos los posts. No es el texto de cada pieza.
 * Cuando exista cuerpo real, dejar de usar este array.
 */
export const journalPlaceholderParagraphs = [
  "Havana rewards slow looking. In this house — as in so many across Miramar, Vedado and Centro — the essential decisions are about light and air before they are about objects.",
  "Thick walls hold the cool of the night. Shutters and breeze-block break the sun into workable bands. A patio, a balcony or a gallery does the work that mechanical systems do elsewhere.",
  "Dwell Havana documents these logics with photography first: material close-ups, inhabited rooms, traces of repair. Imperfection is not styled out — it is the evidence that a place is lived in.",
] as const;
