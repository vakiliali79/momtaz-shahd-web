# Image sources & licences

**Temporary photography.** These photos stand in until original brand photography is produced (see
`docs/visual-identity.md` and `scripts/images/shot-list.mjs`). They are close matches (walnut, date, sesame,
pistachio and spiced cookies, Persian tea, Nowruz, ingredients), **not photos of Momtaz Shahd products**.

## How they were sourced
- Found through **Openverse** (api.openverse.org), the open search engine for Creative Commons media, filtered to
  licences that allow commercial use; files downloaded from Flickr's image host (two via Openverse's image proxy).
- Unsplash, Pexels and Pixabay could not be used from the build environment: Pexels/Pixabay return 403 to
  automated clients and their APIs need a key; Unsplash search needs an API key. Wikimedia Commons rate-limits
  this environment (HTTP 429), so authentic koloocheh/kolompeh photos there could not be downloaded (see below).
- Excluded: NonCommercial (NC) and NoDerivatives (ND) licences, visible brand logos or packaging text, faces as
  subject, honey jars.
- Every file was cropped to its slot's aspect ratio, resized (never upscaled) and converted to WebP q80 with
  `node scripts/images/import-generated.mjs <folder>`. These are modifications under the licence; adapted
  CC BY-SA images remain under CC BY-SA.

## Attribution on the site
CC BY / CC BY-SA require credit visible to visitors. The storefront shows all credits at **/{locale}/credits**
(linked from the footer as “Photo credits”), generated from `src/lib/image-credits.ts`. Keep that page while any
of these files are in use.

## Files

| Slot | File | Title | Author | Licence | Source |
|---|---|---|---|---|---|
| home-hero | `public/images/products/hero.webp` | 2018.12.15 Spiced Walnut Cookies and New CGM Sensor, Washington, DC USA 09162 | [tedeytan](https://www.flickr.com/photos/22526649@N03) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/22526649@N03/32458214758) |
| about-bakery | `public/images/about/bakery.webp` | An Amish woman rolls dough to make small fried pies inside the farmhouse at Yoder's Amish Home. Original image from Carol M. Highsmith’s America, Library of Congress collection. Digitally enhanced by rawpixel. | [Free Public Domain Illustrations by rawpixel](https://www.flickr.com/photos/153584064@N07) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/153584064@N07/45340945785) |
| instagram-1 | `public/images/instagram/1.webp` | Persian tea | [lissac1](https://www.flickr.com/photos/58886130@N03) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/58886130@N03/14579688564) |
| instagram-2 | `public/images/instagram/2.webp` | 85/365 - Star anise and cinnamon sticks | [olfiika](https://www.flickr.com/photos/73941240@N04) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/73941240@N04/8150631256) |
| instagram-3 | `public/images/instagram/3.webp` | Cardamom Pods | [Veganbaking.net](https://www.flickr.com/photos/31104779@N02) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/31104779@N02/4157454523) |
| instagram-4 | `public/images/instagram/4.webp` | Roasted Radish, Dried Fruit and Pistachio Salad | [Migle Seikyte](https://www.flickr.com/photos/69668444@N03) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/69668444@N03/8671568883) |
| instagram-5 | `public/images/instagram/5.webp` | Rolled dough | [Lisa Brewster](https://www.flickr.com/photos/9031691@N08) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/9031691@N08/3014654283) |
| instagram-6 | `public/images/instagram/6.webp` | Persian Tea | [nahid-v](https://www.flickr.com/photos/61507856@N00) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/61507856@N00/19297078282) |
| category-koloocheh | `public/images/categories/koloocheh.webp` | 2018.12.15 Spiced Walnut Cookies and New CGM Sensor, Washington, DC USA 09165 | [tedeytan](https://www.flickr.com/photos/22526649@N03) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/22526649@N03/32458218608) |
| category-kolompeh | `public/images/categories/kolompeh.webp` | 2012: Feb 8 | [lovelihood](https://www.flickr.com/photos/44258887@N04) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/44258887@N04/6844876757) |
| category-gift-boxes | `public/images/categories/gift-boxes.webp` | Queen Bee of Beverly Hills Designer Handbags Holiday | [queenbeeofbeverlyhills](https://www.flickr.com/photos/62997622@N03) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/62997622@N03/8179564865) |
| category-wholesale-packs | `public/images/categories/wholesale-packs.webp` | Sesame Cookies at Good Mong Kok bakery | [Gary Soup](https://www.flickr.com/photos/87117631@N00) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/87117631@N00/1155817564) |
| walnut-koloocheh-450g-1 | `public/images/products/walnut-koloocheh-450g-1.webp` | 2018.12.15 Spiced Walnut Cookies and New CGM Sensor, Washington, DC USA 09161 | [tedeytan](https://www.flickr.com/photos/22526649@N03) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/22526649@N03/45417854745) |
| walnut-koloocheh-450g-2 | `public/images/products/walnut-koloocheh-450g-2.webp` | walnut cookies | [Stiefen Schlingen](https://www.flickr.com/photos/48819629@N02) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/48819629@N02/4635119378) |
| plain-koloocheh-400g-1 | `public/images/products/plain-koloocheh-400g-1.webp` | Cooling | [Ben Chun](https://www.flickr.com/photos/40494725@N00) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/40494725@N00/4179625125) |
| plain-koloocheh-400g-2 | `public/images/products/plain-koloocheh-400g-2.webp` | lime pistachio cookie | [stu_spivack](https://www.flickr.com/photos/35034346243@N01) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/35034346243@N01/2577254058) |
| coconut-koloocheh-450g-1 | `public/images/products/coconut-koloocheh-450g-1.webp` | russian teacakes | [Stacy Spensley](https://www.flickr.com/photos/21001756@N06) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/21001756@N06/8307560889) |
| coconut-koloocheh-450g-2 | `public/images/products/coconut-koloocheh-450g-2.webp` | Sugar Spice Cookies | [Vegan Feast Catering](https://www.flickr.com/photos/25128194@N02) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/25128194@N02/4253470147) |
| cinnamon-koloocheh-450g-1 | `public/images/products/cinnamon-koloocheh-450g-1.webp` | 2018.12.15 Spiced Walnut Cookies and New CGM Sensor, Washington, DC USA 09155 | [tedeytan](https://www.flickr.com/photos/22526649@N03) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/22526649@N03/45417853225) |
| cinnamon-koloocheh-450g-2 | `public/images/products/cinnamon-koloocheh-450g-2.webp` | Cinnamon sticks Spice Related (Free stock photo) | [trophygeek](https://www.flickr.com/photos/65187097@N03) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/65187097@N03/7309905246) |
| mini-walnut-koloocheh-250g-1 | `public/images/products/mini-walnut-koloocheh-250g-1.webp` | Feffernous | [dphiffer](https://www.flickr.com/photos/35034363271@N01) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/35034363271@N01/76319298) |
| mini-walnut-koloocheh-250g-2 | `public/images/products/mini-walnut-koloocheh-250g-2.webp` | Walnut Bread - Walnut halves | [grongar](https://www.flickr.com/photos/70757891@N00) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/70757891@N00/5625927912) |
| date-kolompeh-500g-1 | `public/images/products/date-kolompeh-500g-1.webp` | Tarçınlı İncirli Kurabiye / Figs with Cinnamon Cookies | [İnci Mercan](https://www.flickr.com/photos/53190938@N06) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/53190938@N06/9797774584) |
| date-kolompeh-500g-2 | `public/images/products/date-kolompeh-500g-2.webp` | Date Cookie | [gozamos](https://www.flickr.com/photos/49934554@N08) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/49934554@N08/6908344112) |
| date-walnut-kolompeh-500g-1 | `public/images/products/date-walnut-kolompeh-500g-1.webp` | date roll candy | [Stacy Spensley](https://www.flickr.com/photos/21001756@N06) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/21001756@N06/5302404056) |
| date-walnut-kolompeh-500g-2 | `public/images/products/date-walnut-kolompeh-500g-2.webp` | date roll candy | [Stacy Spensley](https://www.flickr.com/photos/21001756@N06) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/21001756@N06/5302403930) |
| saffron-pistachio-kolompeh-400g-1 | `public/images/products/saffron-pistachio-kolompeh-400g-1.webp` | Pistachio Spritz Pinwheels Lan | [thebittenword.com](https://www.flickr.com/photos/22198928@N00) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/22198928@N00/15856016709) |
| saffron-pistachio-kolompeh-400g-2 | `public/images/products/saffron-pistachio-kolompeh-400g-2.webp` | Pistachios | [Theo Crazzolara](https://www.flickr.com/photos/141324643@N05) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/141324643@N05/39799740255) |
| mixed-gift-box-900g-1 | `public/images/products/mixed-gift-box-900g-1.webp` | Wordpress USB Stick {wrapped} | [Debs (ò‿ó)♪](https://www.flickr.com/photos/30223382@N06) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/30223382@N06/4687827918) |
| mixed-gift-box-900g-2 | `public/images/products/mixed-gift-box-900g-2.webp` | kahk | [Michelle Sym](https://www.flickr.com/photos/33834418@N05) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/33834418@N05/4006916955) |
| nowruz-gift-box-1200g-1 | `public/images/products/nowruz-gift-box-1200g-1.webp` | Haft Sin | [Casey Hugelfink](https://www.flickr.com/photos/93212986@N03) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | [flickr](https://www.flickr.com/photos/93212986@N03/8602387721) |
| nowruz-gift-box-1200g-2 | `public/images/products/nowruz-gift-box-1200g-2.webp` | Grass Haft-sin | [Unknown]() | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [rawpixel](https://www.rawpixel.com/image/3337734/free-photo-image-agropyron-asparagus-basket) |
| luxury-gift-tin-700g-1 | `public/images/products/luxury-gift-tin-700g-1.webp` | Cookies Tins | [Pexels](https://stocksnap.io/author/17102) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [stocksnap](https://stocksnap.io/photo/cookies-tins-4IYZVZD5T1) |
| luxury-gift-tin-700g-2 | `public/images/products/luxury-gift-tin-700g-2.webp` | Another antique cookie tin | [jules:stonesoup](https://www.flickr.com/photos/58367355@N00) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/58367355@N00/8037385607) |
| walnut-koloocheh-carton-5kg-1 | `public/images/products/walnut-koloocheh-carton-5kg-1.webp` | The Intolerant Gourmet's sultana and spice cookies (small aperture) | [Rev Stan](https://www.flickr.com/photos/93376699@N00) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/93376699@N00/4805857976) |
| walnut-koloocheh-carton-5kg-2 | `public/images/products/walnut-koloocheh-carton-5kg-2.webp` | Walnuts | [tacowitte](https://www.flickr.com/photos/31817492@N00) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/31817492@N00/1572408020) |
| date-kolompeh-carton-5kg-1 | `public/images/products/date-kolompeh-carton-5kg-1.webp` | Peanut ginger sesame cookies | [dogplusplus](https://www.flickr.com/photos/96626920@N08) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/96626920@N08/41368473630) |
| date-kolompeh-carton-5kg-2 | `public/images/products/date-kolompeh-carton-5kg-2.webp` | Spices for basmati rice: Bay leaf, cinnamon, green cardamom, fennel, mustard, coriander, cloves | [SaucyGlo](https://www.flickr.com/photos/67238971@N04) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/67238971@N04/6876139620) |
| mixed-carton-10kg-1 | `public/images/products/mixed-carton-10kg-1.webp` | Cookies | [GraveUndertakings](https://www.flickr.com/photos/80091348@N04) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [flickr](https://www.flickr.com/photos/80091348@N04/23219100592) |
| mixed-carton-10kg-2 | `public/images/products/mixed-carton-10kg-2.webp` | Chocolate Chip Shortbread Cookies | [neil conway](https://www.flickr.com/photos/30934989@N06) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | [flickr](https://www.flickr.com/photos/30934989@N06/5450168144) |

## Better matches to download manually (Wikimedia Commons, blocked here)

These real photos of the actual products could not be downloaded from this environment. To use one, save it as
`<shot-id>.jpg` in a folder and run the import script; then update the table above and `src/lib/image-credits.ts`.

| Suggested slot | Photo | Licence |
|---|---|---|
| plain-koloocheh-400g-1 / category-koloocheh | [Kolooche](https://commons.wikimedia.org/wiki/File:Kolooche.jpg) | CC0 |
| date-kolompeh-500g-1 / category-kolompeh | [Kolompeh-Kerman](https://commons.wikimedia.org/wiki/File:Kolompeh-Kerman.png) | CC BY-SA 3.0 |
| walnut-koloocheh-450g-1 | [Fuman Koloocheh](https://commons.wikimedia.org/wiki/File:Fuman_Koloocheh.jpg) (640px, small) | CC BY-SA 3.0 |
| date-kolompeh-500g-2 | [MaamoulCutInHalf](https://commons.wikimedia.org/wiki/File:MaamoulCutInHalf.jpg) | CC BY-SA |
| date-walnut-kolompeh-500g-1 | [Maamoul (241884747)](https://commons.wikimedia.org/wiki/File:Maamoul_(241884747).jpg) | CC BY |
| date-kolompeh-carton-5kg-2 | [Medjool dates as luxury item](https://commons.wikimedia.org/wiki/File:Medjool_dates_as_luxury_item.jpg) | CC BY-SA |
| nowruz-gift-box-1200g-1 | [Haft-sin, Nowruz, Still-life](https://commons.wikimedia.org/wiki/File:Haft-sin,_Nowruz,_Still-life-3205068.jpg) | CC0 |
| instagram-1 | [Persian tea with ghand](https://commons.wikimedia.org/wiki/File:Persian_tea_with_ghand.jpg) | CC BY |
| home-hero | [Date cookies](https://commons.wikimedia.org/wiki/File:Date_cookies.jpg) | CC0 |

Licences of Commons files must be re-checked on the file page before use.
