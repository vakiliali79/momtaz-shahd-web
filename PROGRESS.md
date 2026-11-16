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

## Stage 6 — Online payment and bank transfers (2026-11-16)

**Gateway architecture** (`src/lib/payments/`)
- `PaymentGateway` interface: `request(amount, orderId, callbackUrl, description)` and `verify(params, amount)` (plus `getAuthority` / `buildVerifyParams`). Amounts are Toman; gateways convert.
- `verify` returns `paid`, `failed` (definitely not paid) or `error` (outcome unknown). Only `failed` cancels an order; `error` keeps it pending, because money may have been taken.
- `ZarinpalGateway`: REST v4 `payment/request.json` + `payment/verify.json`, StartPay redirect, amounts sent in Rial, `ZARINPAL_MERCHANT_ID`, `ZARINPAL_SANDBOX`. Codes 100/101 = paid, -51/-54 = failed, everything else = needs review. Contract tests with a stubbed fetch: `pnpm test`.
- `MockGateway`: simulated bank page (`/payment/mock`) with Pay, Cancel and "bank doesn't answer"; it returns through the real callback, so the same code path is exercised. Refused in production unless `ALLOW_MOCK_PAYMENTS=true`.
- `IDPayGateway`: stub (reports itself unconfigured, so online payment stays hidden).
- Chosen by `PAYMENT_GATEWAY=mock|zarinpal|idpay`; online payment is hidden when none is usable.

**Flow**
- Placing an online order goes straight to the gateway. If the gateway cannot be reached, the order is kept and `/checkout/pay/[orderNumber]` offers a retry.
- Each attempt is a `Payment` row (gateway, amount, authority, status, refId, card, raw response).
- `/api/payment/callback` (GET or POST) finds the attempt by its authority, verifies server-to-server, then:
  - paid → order PAID + `paymentRef`;
  - failed → order CANCELLED, stock and coupon use restored; the failed page offers "Order these products again";
  - unknown → "confirming your payment" page with a re-check button (no second "pay" button, to avoid double charges).
- Idempotent: each attempt and each order change state only once (conditional updates). Replayed and concurrent callbacks just redirect. Money arriving for an order that is no longer pending is recorded in the history for a refund.

**Other payment methods**
- Cash on delivery: the order goes straight to PROCESSING.
- Bank transfer: the order stays PENDING. The customer uploads a receipt (JPG/PNG/WebP/PDF, 5 MB, type checked from the file's bytes) on the success page. Files are stored privately in `UPLOAD_DIR` (default `./storage`) and served only to the owner or an admin via `/api/orders/[orderNumber]/receipt`. Admin actions `confirmBankTransferAction` (→ PAID) and `rejectTransferReceiptAction` are in `src/actions/admin/orders.ts` for the admin panel.

**Data changes**: `Payment` model and `PaymentStatus` enum; `Order.receiptPath`, `receiptUploadedAt`, `transferReference` (migrations for SQLite and PostgreSQL). New dependency `server-only`.

**Fixes along the way**
- Session reads now call `connection()`, because Auth.js creates random tokens before reading the request, which Cache Components rejected while prerendering.
- Empty env vars (e.g. `UPLOAD_DIR=""`, `APP_URL=""`, `SMTP_PORT=""`) now fall back to defaults instead of being used as empty values.

**Verified**: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build` pass. End-to-end in the browser against the production build:
- cancel at the bank → order cancelled, stock and coupon restored → reorder;
- pay → PAID with a reference;
- replayed OK/NOK callbacks and 5 concurrent callbacks → a single transition;
- unknown authority;
- "bank doesn't answer" → re-check → PAID;
- cash on delivery → PROCESSING;
- receipt upload: missing file, disguised file, valid file; owner/admin/other/anonymous access;
- admin confirmation → PAID, and a second confirmation is refused;
- Zarinpal selected but unreachable → order kept, retry page;
- no gateway → online payment hidden.

**Open items**
- Zarinpal has not been tested against the real service: Zarinpal's servers refuse connections from this (non-Iranian) cloud machine, and its docs could not be fetched either. Before launch, run one sandbox payment from an Iranian server and compare the request/verify responses and error codes with the official docs.
- Set `APP_URL` (or `NEXT_PUBLIC_SITE_URL`) in production: callback URLs are built from it.
- Online orders whose customer never returns from the gateway stay PENDING with stock reserved; a scheduled job should cancel them after a timeout (`cancelPendingOrder` in `src/lib/orders/cancel.ts` does the work).
- No admin UI yet for confirming bank transfers or reviewing flagged payments.
- Receipts are on the local disk; use object storage on hosts without a persistent disk.

## Stage 7 — Customer account area (2026-11-16)

**Layout**: `/account` with a sidebar on large screens and a bottom tab bar on phones and tablets; the wholesale tab only appears for `WHOLESALE` users. Every page reads the session behind `<Suspense>` and is excluded from search engines.

**Pages**
- Dashboard: order count, last order, default address, wishlist count, quick links.
- My orders (`/account/orders`): number, Jalali/Gregorian date, item count, total, status badge (table on tablets and up, cards on phones).
- Order detail: items, totals, delivery address, payment, shipment tracking code, status timeline (from `OrderStatusHistory`), "Pay now" or "Upload receipt" when relevant, Reorder, and Cancel.
  - Cancel is only offered while PENDING, and not after a bank-transfer receipt was uploaded. It restores stock and the coupon use, and leaves any pending online payment attempt to be verified (paid → flagged for refund).
- Invoice (`/account/orders/[number]/invoice`): a print-friendly page ("Print / Save as PDF") instead of `@react-pdf/renderer`, because the browser shapes Persian/Arabic text correctly and PDF libraries don't reliably. The site header, footer and account navigation are hidden in print.
- Addresses: add, edit, delete (the oldest remaining address becomes default) and set default, with the map pin.
- Profile: name, email (unique), preferred language (switches the site to it), change password. The name in the header updates via an Auth.js session update.
- Wishlist: the heart on product cards now saves to the account when signed in. A guest's hearts are merged in at sign-in, and the list is cleared from the browser at sign-out.
- My reviews: list with approval status, delete, and "products you can review".
  - The review form on a product page appears only for customers with a DELIVERED order containing that product. Every new or edited review waits for moderation.
- Wholesale (`WHOLESALE` role only): wholesale price list, quick bulk order form (quantities per product → cart), and the user's wholesale requests (matched by phone number, because the request form is public).

**Verified**: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build` pass. Browser-tested against the production build:
- dashboard; order list and detail; cancel (stock restored); no cancel after a receipt upload;
- tracking code and timeline; invoice print layout (full width, chrome hidden; PDF export works in Persian); reorder;
- address add / edit / set default / delete default;
- profile validation, header name update, wrong/right current password, language switch to Arabic;
- wishlist guest-to-account merge, save and remove;
- review form gating (guest, not delivered, delivered), rating validation, moderation status;
- wholesale role gating, bulk form errors and cart contents at wholesale prices;
- Persian mobile layout with bottom tabs.

**Open items**
- Admin moderation of reviews, order status changes (shipped/delivered, tracking codes) and wholesale role approval need the admin panel.
- The public wholesale request form (`/wholesale`) is not built yet, so the request list will stay empty until it is.
- Changing a password does not sign out other devices (JWT sessions stay valid until they expire).

## Stage 8 — Admin panel (2026-11-16)

**Access**: `/admin` has its own layout (the storefront moved into a `(shop)` route group) with a collapsible sidebar (remembered per browser) and a drawer on phones. The ADMIN role is checked on the server in the layout, in every page, in every server action and in the upload route — not only in `proxy.ts`. Non-admins get a 404; guests are sent to the login page. Blocked accounts can't sign in and their open sessions stop working.

**Modules**
- Dashboard: sales today and this (Persian) month, pending orders, low-stock products, new wholesale requests; a 30-day daily sales bar chart (Recharts, brand red, hover tooltip, table view, right-to-left in fa/ar); top products for 30 days; latest orders.
- Products: TanStack Table with search, status/category/stock filters, sortable columns and server-side pagination (state in the URL); create/edit form with a tab per language; multi-image upload (`/api/admin/uploads` → `public/uploads`, S3-compatible adapter stub for Liara/Arvan via `STORAGE_DRIVER`); inline stock edit, active toggle, duplicate.
- Categories: CRUD with translated name/description, image and display order; deleting a category that still has products is refused.
- Orders: filters by status, date range, retail/wholesale and payment method, plus search; detail page with customer, items, payment attempts and full history. Status changes follow the allowed transitions (PENDING → PAID/PROCESSING/CANCELLED, PAID → PROCESSING/SHIPPED/CANCELLED, PROCESSING → SHIPPED/CANCELLED, SHIPPED → DELIVERED), write `OrderStatusHistory` with an optional internal note, and can text the customer. Cancelling returns stock and the coupon use. Tracking code (with SMS), bank-transfer confirm/reject with receipt preview, printable invoice (shared with the customer invoice).
- SMS: `SMS_PROVIDER` = console (default) or Kavenegar (stub); texts use the customer's language; every attempt is logged in `SmsLog`.
- Customers: list with search and role/blocked filters, detail with stats, orders and addresses; promote to WHOLESALE or back; block/unblock. Admin accounts (and yourself) can't be changed from the panel.
- Dealers: CRUD with translated name/address/hours, type, province/city from the location list (seed dealers now use location ids), map picker (click to pin, pin at centre, my location), verified and visible toggles, photo.
- Wholesale requests: inbox with status filter and search; detail with contact info, link to the customer if the phone has an account, status workflow (new → contacted → converted/rejected) and team notes.
- Coupons: CRUD (percent or fixed, minimum order, usage limit, last valid day in Tehran time with a calendar-aware preview), active toggle, expired/used-up badges.
- Reviews: moderation queue (pending by default), approve or reject (rejecting deletes, so the customer can write again); the storefront updates immediately.
- Settings: shipping per method (in-province, other provinces, per-province special prices, weight steps, delivery days, city-only courier, pickup address), free-shipping threshold, USD/AED exchange rates, contact details and social links, announcement banner per language, bank-transfer details. The footer, contact page, invoice, home page and a new announcement strip read these settings. English and Arabic visitors see approximate USD/AED under product prices and cart/checkout totals when enabled (payment is always in Toman).
- Translations: every key of `messages/*.json` side by side in fa/en/ar, with search, section filter, "edited" and "missing a language" filters. Edits are saved in `TranslationOverride` and merged over the files in `src/i18n/request.ts` (cached, tag `translations`), so they show on the site right away; invalid ICU syntax or changed `{placeholders}` are refused; "Reset" restores the file text.

**Database**: migration `admin_panel` (SQLite and PostgreSQL): `User.isBlocked`, `WholesaleRequest.adminNote/updatedAt`, `TranslationOverride`, `SmsLog`.

**Verified**: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (new shipping rule tests) and `pnpm build` pass with no warnings. Browser-tested against the production build: every admin page in fa/en/ar returns 200 with no console errors; guests are redirected to login; a status change PAID → PROCESSING writes history and an SMS log; a tracking code is saved and texted; a translation edit appears on the storefront and resets; a broken placeholder is refused; no horizontal scrolling at 320px.

**Open items**
- S3 storage and Kavenegar SMS are stubs: implement before switching `STORAGE_DRIVER`/`SMS_PROVIDER`.
- Admin accounts can only be created by the seed (or the database); there is no admin-user management screen.
- The public wholesale request form is still to be built.
