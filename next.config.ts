import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isProduction = process.env.NODE_ENV === "production";

/** True when the configured public URL is served over HTTPS (invalid or missing URL: false). */
function siteUsesHttps(url: string | undefined): boolean {
  try {
    return url ? new URL(url).protocol === "https:" : false;
  } catch {
    return false;
  }
}

/**
 * HTTPS-only protections (upgrade-insecure-requests, HSTS) are sent only in
 * production when NEXT_PUBLIC_SITE_URL is https://. On a plain-HTTP server they
 * would make browsers request CSS/JS over HTTPS and break the site.
 * Both NODE_ENV and NEXT_PUBLIC_SITE_URL are read at build time: rebuild after
 * switching the site to HTTPS.
 */
const enforceHttps = isProduction && siteUsesHttps(process.env.NEXT_PUBLIC_SITE_URL);
const neshan = Boolean(process.env.NEXT_PUBLIC_NESHAN_KEY);
const s3Origin = process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL).origin : null;

/**
 * Content-Security-Policy. Next.js inlines page data as scripts; a nonce would
 * force every page to render per request (no prerendering), so inline scripts
 * are allowed but everything else is locked down: no plugins, no framing, no
 * foreign scripts (except Neshan's map SDK when it's enabled), forms post only
 * to this site or the payment gateway.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}${neshan ? " https://static.neshan.org" : ""}`,
  `style-src 'self' 'unsafe-inline'${neshan ? " https://static.neshan.org" : ""}`,
  `img-src 'self' data: blob: https://tile.openstreetmap.org${neshan ? " https://*.neshan.org" : ""}${s3Origin ? ` ${s3Origin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${neshan ? " https://*.neshan.org" : ""}${isProduction ? "" : " ws: wss:"}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.zarinpal.com https://payment.zarinpal.com https://sandbox.zarinpal.com",
  "frame-ancestors 'none'",
  ...(enforceHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The dealer map may ask for the visitor's location; nothing else is needed.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), interest-cohort=(), geolocation=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(enforceHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  partialPrefetching: true,
  images: {
    // AVIF where the browser supports it, otherwise WebP.
    formats: ["image/avif", "image/webp"],
    // Product photos change rarely; keep optimised copies for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [40, 64, 96, 128, 192, 256, 320],
    localPatterns: [{ pathname: "/images/**" }, { pathname: "/uploads/**" }, { pathname: "/products/**" }, { pathname: "/categories/**" }, { pathname: "/about/**" }, { pathname: "/instagram/**" }, { pathname: "/icons/**" }],
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
