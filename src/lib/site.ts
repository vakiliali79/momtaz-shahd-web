/** Absolute base URL of the site, used for metadata, hreflang and emails. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const PLACEHOLDER_IMAGE = "/products/placeholder.svg";
