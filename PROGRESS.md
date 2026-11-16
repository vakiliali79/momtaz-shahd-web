# Progress

## Stage 1 — Project foundation (2026-11-16)

**Scaffold**
- Next.js 16.4 (App Router, RSC, Server Actions, Turbopack, Cache Components), React 19.3, TypeScript 6 strict, Tailwind CSS 4.3, ESLint 10, pnpm, `src/` directory.
- shadcn/ui initialised (radix base, "nova" style, RTL mode) with button, dropdown-menu, sheet, input, label, separator, badge, sonner and direction components.

**i18n (next-intl 4)**
- Locales `fa` (default, RTL), `en` (LTR), `ar` (RTL); routes live under `src/app/[locale]/…`.
- `src/proxy.ts` (Next.js 16 renamed `middleware` to `proxy`): locale comes from the URL prefix, then the `NEXT_LOCALE` cookie, then `fa`. `/` redirects to `/fa`; the choice is saved in the cookie for one year. `Accept-Language` is deliberately ignored.
- Messages in `messages/{fa,en,ar}.json`, type-checked against `fa.json` (`src/global.d.ts`).
- The locale is read with `next/root-params`, so every page is statically prerendered per locale.

**Layout & theming**
- Root layout sets `lang`/`dir` and loads one font per locale via `next/font` (Vazirmatn, IBM Plex Sans Arabic, Inter).
- Brand palette as CSS variables (`--brand-*`) mapped onto shadcn semantic tokens and Tailwind theme colours (`brand-red`, `brand-cream`, `brand-gold`, `brand-leaf`, `brand-ink`); light/dark/system via next-themes.
- Fluid type scale (`text-fluid-*`), `shadow-soft`, and a `3xl` breakpoint for very large screens.
- Components in `src/components/layout`: `Container`, `Header` (logo, nav, search, cart with live count, account menu, language switcher, theme toggle, mobile drawer), `Footer` (contact, quick links, newsletter, Enamad placeholder, Instagram), `LanguageSwitcher` (keeps path, query and hash).

**State, forms, utilities**
- Zustand cart store persisted to localStorage (`src/stores/cart.ts`).
- Newsletter form: Zod schema shared by React Hook Form and the server action (the action validates only; nothing is stored yet).
- `formatNumber`, `formatPrice`, `formatDate` in `src/lib/format.ts` (Persian / Arabic-Indic / Latin digits; Jalali for `fa`, Gregorian for `en`/`ar`).

**Placeholder home page** in all three languages with sample products and a localisation check panel.

**Verified**: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` pass with zero errors; redirects, cookie persistence, language switching, RTL/LTR, fonts, dark mode, and 320px–4K layouts checked in Chromium.

**Open items**
- TypeScript is pinned to 6.0.x because typescript-eslint does not support TypeScript 7 yet.
- Phone, email and address in the footer are placeholders (`src/config/site.ts`, message files).
- Nav targets (`/products`, `/wholesale`, `/dealers`, `/about`, `/contact`, `/cart`, `/login`, …) render the localized 404 until those stages are built.
- Prisma, Auth.js, TanStack Table, Recharts and Framer Motion are not installed yet; they will be added in the stages that use them.
- Product photos and the real logo artwork are still needed; the current logo is a drawn stand-in.

## Stage 2 — Database (2026-11-16)

**Setup**
- Prisma 7.10.1 with driver adapters: `better-sqlite3` for local dev, `pg` for production. bcryptjs for password hashes.
- `prisma/schema.prisma` is the single source of truth (SQLite). When `DATABASE_URL` is a `postgresql://` URL, `prisma.config.ts` derives `prisma/postgresql/schema.prisma` from it (only the provider changes). Each database has its own migration history: `prisma/migrations` (SQLite) and `prisma/postgresql/migrations` (PostgreSQL).
- `DATABASE_URL` defaults to `file:./prisma/dev.db` outside production; `.env.example` documents both forms.
- `src/lib/db` exports the shared `db` client; the generated client lives in `src/generated/prisma` (git-ignored, rebuilt on `pnpm install` and `pnpm build`).
- Scripts: `db:migrate`, `db:deploy`, `db:seed`, `db:reset`, `db:studio`, `db:generate`.

**Models**: User, Address, OtpCode, Category, Product, Review, Wishlist, Order, OrderItem, OrderStatusHistory, Coupon, Dealer, WholesaleRequest, Setting.

**Decisions**
- Multilingual fields are JSON objects `{ fa, en, ar }` rather than a Translation table (`src/lib/localized.ts` has the type, Zod schemas and `localize()` reader).
- `Product.images` is a JSON array, because SQLite has no array columns.
- Money is whole Toman: `Int` for unit prices, `BigInt` for order totals.
- Iranian mobile numbers are normalised to `09xxxxxxxxx` and validated in `src/lib/validation/phone.ts`.

**Seed** (`prisma/seed.ts`, re-runnable): 4 categories, 14 products in three languages, 6 sample dealers, 5 settings (shipping, free shipping, exchange rates, contact, announcement banner) and the admin user.

**Verified**: migrate + generate + seed run on both SQLite and a local PostgreSQL 16; `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` pass.

**Open items**
- Seed prices, dealers, exchange rates and contact details are sample data; product image paths point to files that do not exist yet.
- The seeded admin password (`Admin@1234`) must be changed before going live.
- Nothing in the UI reads from the database yet; the home page still uses its hardcoded sample products.

## Stage 3 — Public storefront (2026-11-16)

**Pages** (Server Components, data from Prisma, all text via next-intl in fa/en/ar)
- Home: hero with Motion entrance, category tiles, featured products carousel (Embla), "Why Momtaz Shahd" cards, testimonials (approved reviews), dealer teaser with an SVG mini map, Instagram placeholder, newsletter CTA.
- Products (`/products`) and Category (`/category/[slug]`): responsive grid (1 → 2 → 3 → 4 → 5 columns), filters by category, price range and in-stock (sidebar on desktop, drawer on mobile), sorting, search, pagination. All filter state lives in the URL and is validated with Zod.
- Product detail (`/products/[slug]`): gallery with thumbnails and zoom, price, facts, quantity stepper, add to cart, wholesale price hint, tabs (Description / Ingredients / Reviews), related products, breadcrumbs, and localized metadata with Open Graph and hreflang alternates.
- About and Contact. The contact form is validated with Zod on client and server, saved to the new `ContactMessage` table, and emailed to the admin via SMTP when configured.
- `loading.tsx` skeletons for the products, category and product-detail routes; out-of-stock state on cards and the detail page.

**How it works**
- `src/lib/data/catalog.ts` loads the whole active catalogue once per locale with `"use cache"` (tag `catalog`, lifetime "hours"); listing pages filter, sort and paginate it in memory (`src/lib/catalog-query.ts`). Admin mutations must call `revalidateTag("catalog")` / `"reviews"` / `"dealers"`.
- Images: `public/products/placeholder.svg` (brand cream) is shown for any image file that is missing. Drop photos into `public/products` using the names in `public/products/README.md`.
- Wishlist is stored in the browser (localStorage) until accounts exist.
- New env vars in `.env.example`: `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `SMTP_*`.

**Verified**: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` pass (85 static pages). Browser-tested filters, sorting, search, pagination, cart, wishlist, tabs, zoom, contact form, out-of-stock, RTL/LTR and 320px–1920px layouts with no console errors.

**Open items**
- Email sending is untested against a real SMTP server (none configured here); without `SMTP_HOST` and `ADMIN_EMAIL` messages are only saved.
- The contact form has a honeypot but no rate limiting.
- Seed now includes 4 sample customers with 8 sample reviews, and one sold-out product (cinnamon koloocheh) to show the out-of-stock state.
- The mini map outline of Iran is a rough illustration; the Instagram section shows placeholder tiles.
- Review submission, `/wholesale`, `/dealers`, `/cart` and account pages are not built yet.
- `pnpm build` needs a migrated and seeded database, because pages are prerendered from it.

## Stage 4 — Cart (2026-11-16)

**Store** (`src/stores/cart.ts`, Zustand, persisted to localStorage as `momtaz-shahd-cart` v2)
- Items carry productId, slug, name in all three languages, image, unit price, wholesale price and minimum, weight, quantity and max stock; plus the applied coupon.
- Actions: `addItem` (capped at stock, returns how many were added), `updateQuantity`, `removeItem` / `restoreItem` (undo), `clearCart`, `applyCoupon` / `removeCoupon`, `syncItems`.
- Hydration guard: the store loads after mount; `useCartHydrated()` lets components show a skeleton instead of an empty cart. Changes in another tab are picked up.
- Pricing rules live in `src/lib/cart.ts` (pure functions, reusable by checkout): wholesale price applies automatically once quantity ≥ `minWholesaleQty`; coupon discount; shipping estimate; totals.

**UI**
- Add-to-cart on cards and the product page: icon swaps to a check mark, the header bag bounces, and a localized toast offers "View cart".
- Cart drawer opens from the inline-end edge (right in English, left in Persian/Arabic): items, quantity stepper, remove with undo, subtotal, Checkout and View cart.
- `/cart` page: table on tablets and up, cards on phones; coupon field; summary with subtotal, wholesale savings, discount, shipping estimate with free-shipping progress, total; continue shopping, clear cart (with undo), checkout. Empty state links to products. Not indexed by search engines.
- Product page shows the live line total and switches to the wholesale price at the minimum quantity.

**Server**
- `getCartProducts` re-reads price and stock whenever the cart page loads or the drawer opens: stale prices are corrected, quantities capped to stock, and removed or sold-out products dropped (with a toast).
- `checkCoupon` validates codes (active, not expired, usage limit, minimum order) with Zod.
- `getShippingConfig` reads the `shipping` and `freeShipping` settings (tag `settings`).
- Seed adds sample coupons: `WELCOME10` (10%, min 300,000), `NOWRUZ1405` (50,000 off, min 500,000), `EXPIRED2025` (expired, for testing).

**Verified**: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` pass. Browser-tested add/remove/undo, stock caps, wholesale switch, every coupon error, totals, cross-tab sync, stale-price correction, RTL/LTR drawer side and 320px layout with no console errors.

**Open items**
- `/checkout` does not exist yet; the Checkout buttons lead to the 404 page.
- Cart prices in the browser are only a display: checkout must recompute everything on the server with `src/lib/cart.ts`.
- The shipping estimate ignores city-only methods (Tehran courier) because the destination is unknown until checkout.
- Coupon checks have no rate limiting, and coupon usage is not counted until orders exist.
- Approximate USD/AED prices for en/ar (from CLAUDE.md) are not shown yet.

## Stage 5 — Accounts and checkout (2026-11-16)

**Accounts** (needed because checkout requires login)
- Auth.js v5 (`next-auth@5.0.0-beta.32`, the only v5 release line) with phone + password and JWT sessions: `src/auth.ts`, data-access helpers in `src/lib/session.ts`.
- `/login` and `/register` pages (Zod on client and server, safe `callbackUrl`), sign-out from the account menu and mobile menu. The header learns the session through a small `<Suspense>` hole, so pages stay prerendered.
- `src/proxy.ts` redirects signed-out visitors from `/checkout` and `/account` to `/login?callbackUrl=…`; pages re-check the session themselves.
- New env vars: `AUTH_SECRET` (required), `PAYMENT_GATEWAY`, `ALLOW_MOCK_PAYMENTS`.

**Checkout** (`/checkout`, three steps)
1. Address: pick a saved address or add one. Provinces and cities come from `src/data/iran-locations.json` (31 provinces, 211 main cities, fa/en/ar labels); 10-digit postal code (Persian digits accepted); receiver name and mobile; optional map pin (Leaflet + OpenStreetMap, `src/components/map/` — reusable for the dealer locator).
2. Shipping: Express Post, Tipax, same-day courier (only in the factory's city) and factory pickup. Costs come from `calculateShipping` in `src/lib/shipping.ts`, using the rates in the `shipping` setting (in-province / out-of-province, per extra kg) and the free-shipping threshold.
3. Payment: online gateway, cash on delivery, bank transfer (wholesale orders only); order note.
- Order summary is sticky on desktop and a bottom bar with an expandable sheet on phones.

**placeOrder** (`src/actions/checkout.ts`), in one database transaction: re-reads prices, decrements stock only if still available, validates the coupon and counts its use, checks the shipping method for the address, recomputes totals with the same functions as the browser, refuses the order if the total differs from what the customer saw, generates `MS-YYYYMMDD-NNNN` (Tehran date, retried on collision), and saves the order, items, address snapshot and status history. The cart is cleared only after it succeeds.

**After placing**
- `/checkout/success/[orderNumber]`: thank-you message, order details, bank details for transfers, "pay now" for unpaid online orders.
- `/checkout/failed/[orderNumber]`: payment failed, with retry.
- `/checkout/pay/[orderNumber]`: simulated gateway (development only).
- Orders are only visible to their owner.

**Data changes**: `Order.couponCode` (migrations for SQLite and PostgreSQL); `shipping` setting format v2 (the seed upgrades the old format); new `bankTransfer` setting with placeholder account details.

**Verified**: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` pass. Browser-tested end to end against the production build: login redirect, registration, address validation and saving, map pin, shipping costs and courier restriction, online payment failure → retry → paid, wholesale order with coupon + free shipping + bank transfer, price change and stock drop during checkout (order refused, coupon not consumed, cart refreshed), another user cannot see the order, sign-out, Persian 320px layout.

**Open items**
- No real payment gateway yet; `PAYMENT_GATEWAY=mock` is refused in production unless `ALLOW_MOCK_PAYMENTS=true`. Integrating a provider (e.g. Zarinpal) needs a merchant account.
- Unpaid online orders keep their stock reserved indefinitely; they need an expiry job that cancels them and restores stock.
- Shipping rates, the origin (Tehran) and pickup address, and bank account details are placeholders in the seed.
- No OTP sign-in, password reset, rate limiting on login/coupon/order attempts, or "My orders" page yet (`/account/orders` 404s).
- The city list holds main cities only; customers in smaller towns must pick the nearest listed city until the JSON is extended.
- OpenStreetMap's public tile server suits low traffic only; a commercial tile provider (or Neshan) may be needed at scale.
