import type { MetadataRoute } from "next";
import { siteDescription, siteName } from "@/lib/site";

/**
 * Iconos provisionales (monograma DH). Sustituirlos junto con
 * public/og-placeholder.png. Ver docs/PRODUCT/contenido-placeholder.md.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: "/",
    display: "browser",
    background_color: "#faf7f2",
    theme_color: "#161412",
    icons: [
      {
        src: "/icon-192-placeholder.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-placeholder.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
