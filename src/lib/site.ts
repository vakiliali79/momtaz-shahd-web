/** Absolute base URL of the site, used for metadata, hreflang and emails. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const PLACEHOLDER_IMAGE = "/products/placeholder.svg";

/**
 * Public origin for links that leave the site, such as payment callbacks.
 * APP_URL is read at runtime (server only); NEXT_PUBLIC_SITE_URL is fixed at
 * build time. Set one of them in production.
 */
export function getAppOrigin(): string {
  return (process.env.APP_URL || SITE_URL).replace(/\/+$/, "");
}
