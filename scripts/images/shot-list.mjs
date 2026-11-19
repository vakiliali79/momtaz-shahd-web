// Shot list for every image slot the storefront references.
// Each entry: `id` (source file name expected from the generator), `out`
// (path under public/images/, always WebP — served for the matching .jpg reference
// by src/lib/data/images.ts), `width`/`height` (final pixels) and `prompt`.
// Prompts describe only what the product data states; they never ask for
// readable text, labels or logos, so no fake packaging copy is produced.

export const STYLE = [
  "Editorial food photography, natural soft window light from the side, gentle shadows",
  "warm cream and off-white surfaces (#F5E6D3 / #FAF3EA), light walnut wood and linen props",
  "subtle accents of deep red (#C8102E) and leaf green (#3E8E41) only in small props such as a ceramic dish or a sprig of mint",
  "shallow depth of field, crisp focus on the cookies, appetising, clean and uncluttered, generous negative space",
  "photorealistic, 50mm lens, no text, no letters, no logos, no labels, no watermarks, no people's faces",
].join(", ");

const KOLOOCHEH = "round, slightly domed, golden-brown filled Iranian koloocheh cookies with a fine pressed pattern on top";
const KOLOMPEH = "rectangular golden Kerman kolompeh pastries with a soft date filling";

/** @type {{ id: string; out: string; width: number; height: number; prompt: string }[]} */
const products = [
  ["walnut-koloocheh-450g", `${KOLOOCHEH}, each topped with a walnut half, walnut-cinnamon filling`, "one cookie broken open to show the walnut-cinnamon filling, a few walnut halves and cinnamon sticks nearby"],
  ["plain-koloocheh-400g", `${KOLOOCHEH}, plain tops, sugar-cinnamon filling`, "cookies beside a glass of Persian black tea on a saucer, afternoon-tea mood"],
  ["coconut-koloocheh-450g", `${KOLOOCHEH}, coconut filling`, "one cookie halved to show a white coconut filling, a little desiccated coconut and a vanilla pod nearby"],
  ["cinnamon-koloocheh-450g", `${KOLOOCHEH}, Ceylon cinnamon and brown sugar filling`, "one cookie broken to show a dark cinnamon brown-sugar filling, Ceylon cinnamon quills and a few cardamom pods"],
  ["mini-walnut-koloocheh-250g", "bite-size small round koloocheh cookies, each topped with a small walnut piece, about twelve on a plate", "a hand-sized serving dish of the mini cookies offered on a tea tray for guests"],
  ["date-kolompeh-500g", `${KOLOMPEH}, sprinkled with sesame seeds`, "one kolompeh cut to show dark Mazafati date filling, a few whole dates, cardamom pods and a cinnamon stick"],
  ["date-walnut-kolompeh-500g", `${KOLOMPEH} studded with walnut pieces, topped with sesame`, "a cross-section showing date filling with visible walnut pieces, walnut halves and dates around"],
  ["saffron-pistachio-kolompeh-400g", "rectangular saffron-gold kolompeh pastries decorated with slivered green pistachios", "one pastry cut to show date filling, a small dish of saffron threads and slivered pistachios"],
  ["mixed-gift-box-900g", "an elegant open gift box (plain, unprinted) holding an assortment of round koloocheh and rectangular kolompeh, 18 pieces neatly arranged", "the box partly open with a deep red ribbon, a few cookies set out in front"],
  ["nowruz-gift-box-1200g", "an open festive gift box (plain, unprinted) with walnut and coconut koloocheh and date kolompeh, 24 pieces", "Nowruz table setting around the box: a small dish of sprouted wheat (sabzeh), a red apple, hyacinth flowers"],
  ["luxury-gift-tin-700g", "an open round keepsake tin decorated with a traditional Persian geometric pattern (no writing), filled with saffron kolompeh and walnut koloocheh, 14 pieces", "the closed tin with its patterned lid, two cookies set beside it on linen"],
  ["walnut-koloocheh-carton-5kg", "a plain brown corrugated shipping carton (no printing) opened to show many individually wrapped round walnut koloocheh in clear wrappers", "a close view of several individually wrapped cookies stacked in neat rows inside the carton"],
  ["date-kolompeh-carton-5kg", "a plain brown corrugated carton (no printing) opened to show many individually wrapped rectangular date kolompeh in clear wrappers", "close view of the wrapped kolompeh in tidy rows, a stack of closed cartons softly blurred behind"],
  ["mixed-carton-10kg", "a large plain brown carton (no printing) opened to show individually wrapped walnut, coconut and plain koloocheh and date kolompeh in separate rows", "a top-down view of the carton's organised rows of different wrapped cookies"],
].flatMap(([slug, subject, detail]) => [
  { id: `${slug}-1`, out: `images/products/${slug}-1.webp`, width: 1600, height: 1600, prompt: `Square hero product shot, three-quarter angle: ${subject}, arranged on a cream ceramic plate on a light linen cloth. ${STYLE}` },
  { id: `${slug}-2`, out: `images/products/${slug}-2.webp`, width: 1600, height: 1600, prompt: `Square close-up detail shot: ${subject}; ${detail}. ${STYLE}` },
]);

const categories = [
  ["koloocheh", `an abundant arrangement of ${KOLOOCHEH} — walnut-topped, plain and coconut varieties — on a large cream platter`],
  ["kolompeh", `a neat arrangement of ${KOLOMPEH}, some sprinkled with sesame and some with slivered pistachios, with whole dates beside them`],
  ["gift-boxes", "several open plain unprinted gift boxes and a patterned keepsake tin filled with koloocheh and kolompeh, deep red ribbons"],
  ["wholesale-packs", "neatly stacked plain brown cartons (no printing), one open showing individually wrapped cookies in rows, clean bakery storeroom"],
].map(([slug, subject]) => ({ id: `category-${slug}`, out: `images/categories/${slug}.webp`, width: 1200, height: 900, prompt: `4:3 category image: ${subject}. ${STYLE}` }));

const editorial = [
  { id: "home-hero", out: "images/products/hero.webp", width: 1600, height: 1600, prompt: `Square brand hero image: a generous still life of walnut-topped round koloocheh and sesame-topped rectangular date kolompeh on a cream ceramic platter, a glass of Persian tea, walnuts and dates scattered, warm morning light, space around the subject. ${STYLE}` },
  { id: "about-bakery", out: "images/about/bakery.webp", width: 1600, height: 1600, prompt: `Square image inside a small traditional bakery: trays of freshly baked golden koloocheh on a floured wooden worktable, wooden carved cookie moulds, hands of a baker (no face) pressing dough, warm light. ${STYLE}` },
  ...[
    "overhead flat lay of walnut koloocheh around a glass of tea on a linen cloth",
    "a single koloocheh broken in half showing its filling, macro",
    "baker's hands (no face) pressing a carved wooden mould into dough",
    "a stack of sesame-topped date kolompeh beside fresh Mazafati dates",
    "an open plain gift box of mixed cookies with a deep red ribbon",
    "a Nowruz table corner with sabzeh, hyacinth and a plate of koloocheh",
  ].map((subject, index) => ({ id: `instagram-${index + 1}`, out: `images/instagram/${index + 1}.webp`, width: 1080, height: 1080, prompt: `Square social-media style photo: ${subject}. ${STYLE}` })),
];

export const SHOTS = [...editorial, ...categories, ...products];
