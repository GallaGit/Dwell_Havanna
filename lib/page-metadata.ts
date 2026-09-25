import type { Metadata } from "next";
import { deliveryImageUrl } from "./image-delivery";
import {
  canonicalFor,
  placeholderSocialImage,
  siteName,
} from "./site";

export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const branded = `${title} — ${siteName}`;
  const imageUrl = image ? deliveryImageUrl(image) : placeholderSocialImage;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: branded,
      description,
      url: canonicalFor(path),
      siteName,
      type,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: branded,
      description,
      images: [imageUrl],
    },
  };
}
