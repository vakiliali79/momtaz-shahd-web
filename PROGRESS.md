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
