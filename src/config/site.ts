/**
 * Non-translatable site-wide constants.
 * TODO: replace the placeholder phone and email with the real ones.
 */
export const siteConfig = {
  phone: "+98 21 0000 0000",
  email: "info@example.com",
  social: {
    instagram: "https://www.instagram.com/momtaz_shahd",
  },
} as const;

export const mainNav = [
  { key: "home", href: "/" },
  { key: "products", href: "/products" },
  { key: "wholesale", href: "/wholesale" },
  { key: "dealers", href: "/dealers" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

export type MainNavKey = (typeof mainNav)[number]["key"];
