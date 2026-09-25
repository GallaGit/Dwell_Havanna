/**
 * Textos de ejemplo de properties y journal.
 * Las URLs de foto y el cuerpo repetido de los posts están en lib/placeholders.ts.
 */

import {
  journalPlaceholderParagraphs,
  placeholderImage,
  placeholderPhoto,
} from "./placeholders";

export type Property = {
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

export type JournalPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  date: string;
  readingTime: string;
  /** PLACEHOLDER compartido hasta que cada post tenga cuerpo propio. */
  body: readonly string[];
};

const img = placeholderImage;

export const properties: Property[] = [
  {
    slug: "casa-miramar-1938",
    name: "Casa Miramar, 1938",
    location: "Miramar, Havana",
    character: "Modernist villa · courtyard · terrazzo",
    description:
      "A 1938 modernist villa where sea light moves across terrazzo, timber screens and a quiet central patio.",
    cover: img(placeholderPhoto.casaMiramar),
    images: [
      img(placeholderPhoto.casaMiramar),
      img(placeholderPhoto.casaMiramarInterior),
      img(placeholderPhoto.casaMiramarRoom),
      img(placeholderPhoto.casaMiramarDetail),
    ],
    facts: [
      { label: "District", value: "Miramar" },
      { label: "Year", value: "1938, restored 2021" },
      { label: "Area", value: "340 m²" },
      { label: "Type", value: "Single villa + patio" },
      { label: "Materials", value: "Terrazzo, cedar, lime plaster" },
    ],
    architecture:
      "A compact modernist volume organised around a patio. Deep loggias temper the western sun; original steel windows were retained and repaired rather than replaced. The plan is simple — day rooms to the garden, night rooms above — allowing cross-ventilation through every principal space.",
    interior:
      "Interiors keep the 1938 shell legible: terrazzo floors, cedar joinery, lime-washed walls. Furniture is low and quiet, Cuban mid-century pieces alongside contemporary craft. Light, not objects, is the decoration.",
    story:
      "Built by a Havana engineer for his family, the house passed through three generations before a careful restoration. Plaster scars were left visible in the stair hall — a record of habitation rather than a flaw to erase.",
  },
  {
    slug: "apartamento-vedado-luz",
    name: "Apartamento Luz",
    location: "El Vedado, Havana",
    character: "1950s apartment · breeze-block · balcony",
    description:
      "A corner apartment in El Vedado where breeze-block, mosaic and a long balcony frame daily life above the street.",
    cover: img(placeholderPhoto.vedado),
    images: [
      img(placeholderPhoto.vedado),
      img(placeholderPhoto.vedadoLiving),
      img(placeholderPhoto.vedadoRoom),
    ],
    facts: [
      { label: "District", value: "El Vedado" },
      { label: "Year", value: "1954" },
      { label: "Area", value: "128 m²" },
      { label: "Type", value: "Corner apartment" },
      { label: "Detail", value: "Breeze-block, hydraulic mosaic" },
    ],
    architecture:
      "Typical Vedado rationalism: a raised ground floor, continuous balcony, and operable screens that negotiate sun and breeze. The corner condition gives dual aspect — morning light in the kitchen, evening light in the salon.",
    interior:
      "Hydraulic mosaic retained throughout; kitchen rebuilt in oiled timber and honed stone. Books, plants and a single long table carry the domestic rhythm.",
    story:
      "Lived in continuously since 1956, the flat preserves layers of wallpaper, paint and repair. The current custodians chose to edit, not erase.",
  },
  {
    slug: "casa-colon-patio",
    name: "Casa Colón Patio",
    location: "Centro Habana, Havana",
    character: "Colonial patio house · lime · timber",
    description:
      "A colonial patio house in Centro where thick walls, shutters and a single orange tree order the day.",
    cover: img(placeholderPhoto.colon),
    images: [
      img(placeholderPhoto.colon),
      img(placeholderPhoto.colonGallery),
      img(placeholderPhoto.colonRoom),
    ],
    facts: [
      { label: "District", value: "Centro Habana" },
      { label: "Year", value: "c. 1890" },
      { label: "Area", value: "210 m²" },
      { label: "Type", value: "Patio house" },
      { label: "Materials", value: "Lime, timber, encaustic tile" },
    ],
    architecture:
      "Load-bearing masonry, high ceilings and a central patio that acts as lung and lamp. Rooms open directly to the gallery; shutters modulate light to a soft, workable glow.",
    interior:
      "Sparse, tactile rooms. Lime plaster left matte, timber darkened by time, tile patterns unrepeated. Imperfection is kept as texture.",
    story:
      "Once subdivided, now reunified. Traces of partition walls remain as faint lines — a gentle history of density and return.",
  },
];

export const journalPosts: JournalPost[] = [
  {
    slug: "light-in-vedado",
    title: "Light in El Vedado: how shutters shape a room",
    category: "Interiors",
    excerpt:
      "Morning in Vedado is measured in slats — a study of how timber screens soften the tropical sun into inhabitable calm.",
    image: img(placeholderPhoto.journalLight, 1200),
    date: "No. 04 — September 2026",
    readingTime: "6 min",
    body: journalPlaceholderParagraphs,
  },
  {
    slug: "terrazzo-memory",
    title: "Terrazzo as memory: floors that remember Havana",
    category: "Materials",
    excerpt:
      "Poured, ground and polished in place — terrazzo carries aggregate, labour and time in a single surface.",
    image: img(placeholderPhoto.journalTerrazzo, 1200),
    date: "No. 03 — August 2026",
    readingTime: "5 min",
    body: journalPlaceholderParagraphs,
  },
  {
    slug: "patio-houses",
    title: "The patio house endures",
    category: "Architecture",
    excerpt:
      "Two centuries on, the patio remains Havana's most intelligent room — climate, privacy and community at once.",
    image: img(placeholderPhoto.journalPatio, 1200),
    date: "No. 02 — July 2026",
    readingTime: "8 min",
    body: journalPlaceholderParagraphs,
  },
  {
    slug: "people-who-restore",
    title: "The people who restore, quietly",
    category: "People",
    excerpt:
      "Carpenters, masons and ironworkers keeping tacit knowledge alive — portraits from three workshops in Centro.",
    image: img(placeholderPhoto.journalPeople, 1200),
    date: "No. 01 — June 2026",
    readingTime: "7 min",
    body: journalPlaceholderParagraphs,
  },
];

export const getProperty = (slug: string) =>
  properties.find((p) => p.slug === slug);

export const getPost = (slug: string) =>
  journalPosts.find((p) => p.slug === slug);
