import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/** Crawl everything public; keep private, per-user and transactional pages out. */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["admin", "account", "checkout", "cart", "payment", "login", "register"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...privatePaths.map((path) => `/*/${path}`)],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
