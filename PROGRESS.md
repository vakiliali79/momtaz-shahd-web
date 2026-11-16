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
