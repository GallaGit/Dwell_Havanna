import type { NextConfig } from "next";
import { imageRemotePatterns } from "./lib/image-hosts";
import { COOP_VALUE, HSTS_VALUE } from "./lib/security-headers";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: imageRemotePatterns(process.env.NEXT_PUBLIC_SUPABASE_URL),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: HSTS_VALUE },
          { key: "Cross-Origin-Opener-Policy", value: COOP_VALUE },
        ],
      },
    ];
  },
};

export default nextConfig;
