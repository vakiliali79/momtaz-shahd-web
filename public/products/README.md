# Product photos

Drop product photos here. The storefront shows the cream placeholder
(`placeholder.svg`) for any image file that does not exist yet.

- File names come from `Product.images` in the database. The seed uses
  `/products/<product-slug>-1.jpg`, `/products/<product-slug>-2.jpg`
  (e.g. `walnut-koloocheh-450g-1.jpg`). The first image is the cover.
- Use square images, at least 1200×1200 px, JPG or WebP.
- Category tiles use `/categories/<category-slug>.jpg` (folder `public/categories`).
- After adding files, rebuild or restart the app so the catalogue cache picks them up.
