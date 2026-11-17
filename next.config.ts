import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // AVIF where the browser supports it, otherwise WebP.
    formats: ["image/avif", "image/webp"],
    // Product photos change rarely; keep optimised copies for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [40, 64, 96, 128, 192, 256, 320],
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/products/**" }, { pathname: "/categories/**" }, { pathname: "/about/**" }, { pathname: "/instagram/**" }, { pathname: "/icons/**" }],
  },
  experimental: {
    // Bank-transfer receipts (up to 5 MB) are uploaded through a Server Action.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
