# Momtaz Shahd — Visual Identity & Photography Art Direction

Derived from the shipped implementation (`src/app/globals.css`, `src/components/**`,
catalog data), not from assumptions.

## 1. What the brand sells (from the catalog)
Traditional Iranian cookies only — no other product lines exist in the data:
- **Koloocheh** (round, filled): walnut, plain, coconut, cinnamon, mini walnut.
- **Kolompeh** (rectangular, date-filled): date (Mazafati, sesame), date-walnut, saffron-pistachio.
- **Gift boxes**: mixed box (18 pcs), Nowruz box (24 pcs), patterned keepsake tin (14 pcs).
- **Wholesale packs**: 5 kg and 10 kg cartons of individually wrapped cookies.

Imagery must show these exact products. Nothing beyond the stored descriptions
(fillings, toppings, piece counts) may be implied — no claims, weights or labels.

## 2. Implemented design tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| brand-red | `#C8102E` | text `#F26B7C` | CTAs, badges, logo badge |
| brand-cream | `#F5E6D3` | foreground | hero card, warm surfaces |
| brand-gold | `#B8763E` (ink `#8A5524`) | `#E0AA74` | accents, ratings |
| brand-leaf | `#3E8E41` (ink `#2E6F31`) | `#6CBF6F` | logo leaf, success |
| brand-ink | `#2B2118` | — | body text |
| background / muted | `#FFFFFF` / `#FAF3EA` | `#17110C` / card `#211912` | surfaces |
| border | `#ECDFD0` | — | hairlines |

- Shape: `--radius` 0.75rem; cards `rounded-2xl`, gallery `rounded-3xl`, hero `rounded-[2.5rem]`.
- Depth: one soft shadow (`--shadow-soft`); no hard drop shadows.
- Type: Vazirmatn (fa), IBM Plex Sans Arabic (ar), Inter (en); fluid `text-fluid-*` scale.
- Motion: gentle lift on cards, scroll reveal, reduced-motion respected.
- Mood: lots of white space, warm and friendly rather than luxurious-dark.

## 3. Photography art direction (one style for every image)
- **Light:** soft natural side light, warm morning tone, gentle shadows — matches `--shadow-soft`.
- **Surfaces:** cream/off-white ceramics, linen, light walnut wood — matching `#F5E6D3` / `#FAF3EA`
  so photos sit seamlessly on cards in both themes.
- **Colour accents:** small touches of red (`#C8102E`: ribbon, dish) and leaf green (`#3E8E41`: mint, sabzeh).
  Never full-red backgrounds.
- **Props (cultural, truthful):** Persian tea glass, walnuts, Mazafati dates, cinnamon, cardamom, saffron,
  pistachios; Nowruz items only for the Nowruz box.
- **Composition:** subject centred with breathing room (cards crop with `object-cover`); square for
  product/hero/about/social, 4:3 for categories.
- **Hard rules:** no text, letters, logos or labels on any packaging (plain, unprinted boxes and cartons);
  no faces; no stock photos; no illustrations standing in for photos.

## 4. Image slots & files
All slots are listed with prompts in `scripts/images/shot-list.mjs` (40 images).
| Slot | Referenced as | Stored as | Size |
|---|---|---|---|
| Home hero | `/products/hero.jpg` | `public/images/products/hero.webp` | 1600² |
| About story | `/about/bakery.jpg` | `public/images/about/bakery.webp` | 1600² |
| Instagram ×6 | `/instagram/N.jpg` | `public/images/instagram/N.webp` | 1080² |
| Categories ×4 | `/categories/<slug>.jpg` | `public/images/categories/<slug>.webp` | 1200×900 |
| Products 14×2 | `/products/<slug>-{1,2}.jpg` | `public/images/products/<slug>-{1,2}.webp` | 1600² |

`resolveImage`/`resolveImages` (`src/lib/data/images.ts`) serve `/images/<path>.webp` (or a `.webp` sibling) for any
`.jpg`/`.png` reference, so database rows and product data stay untouched; `next/image`
still produces AVIF/WebP variants at the right `sizes`.

## 5. Producing the images
1. Generate each shot with an image model, using its `prompt`, saving files named `<id>.png`
   (e.g. `walnut-koloocheh-450g-1.png`) in one folder.
2. Review every image: correct product shape/filling, no text or garbled labels.
3. `node scripts/images/import-generated.mjs <folder>` → resizes, converts to WebP q80 and
   writes to `public/`; it reports which shots are still missing.
4. `pnpm build` and check pages; missing shots keep showing the brand placeholder.
