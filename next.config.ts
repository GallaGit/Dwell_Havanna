import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      // Supabase Storage (bucket dwell-media) — Fase 1
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
