/**
 * Seeds the database with starter data. Safe to run repeatedly: every record
 * is upserted by a stable key (slug, phone, setting key, dealer id).
 *
 *   pnpm db:seed
 *
 * Product prices, dealers and contact details are SAMPLE DATA for
 * development. Replace them through the admin panel before going live.
 */
import "dotenv/config";

import bcrypt from "bcryptjs";

import { CouponType, DealerType, Role } from "../src/generated/prisma/client";
import { createPrismaClient } from "../src/lib/db/client";
import type { LocalizedText } from "../src/lib/localized";

const prisma = createPrismaClient();

// ───────────────────────────── Admin ─────────────────────────────

const ADMIN = {
  phone: "09120000000",
  password: "Admin@1234",
  name: "مدیر سایت",
};

// ─────────────────────────── Categories ───────────────────────────

type CategorySlug = "koloocheh" | "kolompeh" | "gift-boxes" | "wholesale-packs";

const categories: {
  slug: CategorySlug;
  name: LocalizedText;
  description: LocalizedText;
  image: string;
}[] = [
  {
    slug: "koloocheh",
    name: { fa: "کلوچه", en: "Koloocheh", ar: "كلوجة" },
    description: {
      fa: "کلوچه‌های گرد و مغزدار با دستور پخت سنتی؛ نرم، خوش‌عطر و تازه.",
      en: "Round, filled cookies baked to a traditional recipe — soft, fragrant and fresh.",
      ar: "كعك مستدير محشو يُخبز بوصفة تقليدية؛ طري وعطِر وطازج.",
    },
    image: "/categories/koloocheh.jpg",
  },
  {
    slug: "kolompeh",
    name: { fa: "کلمپه", en: "Kolompeh", ar: "كلمبة" },
    description: {
      fa: "کلمپه کرمانی با مغز خرما، هل و دارچین و روکش کنجد.",
      en: "Kerman-style date-filled cookies scented with cardamom and cinnamon, finished with sesame.",
      ar: "كلمبة كرمانية محشوة بالتمر والهيل والقرفة ومغطاة بالسمسم.",
    },
    image: "/categories/kolompeh.jpg",
  },
  {
    slug: "gift-boxes",
    name: { fa: "جعبه‌های هدیه", en: "Gift Boxes", ar: "علب الهدايا" },
    description: {
      fa: "بسته‌بندی‌های نفیس برای عید، مهمانی و هدیه سازمانی.",
      en: "Elegant assortments for Nowruz, gatherings and corporate gifts.",
      ar: "تشكيلات أنيقة لعيد النوروز والمناسبات وهدايا الشركات.",
    },
    image: "/categories/gift-boxes.jpg",
  },
  {
    slug: "wholesale-packs",
    name: { fa: "بسته‌های عمده", en: "Wholesale Packs", ar: "عبوات الجملة" },
    description: {
      fa: "کارتن‌های اقتصادی برای فروشگاه‌ها، کافه‌ها و نمایندگان.",
      en: "Economy cartons for shops, cafés and dealers.",
      ar: "كراتين اقتصادية للمتاجر والمقاهي والوكلاء.",
    },
    image: "/categories/wholesale-packs.jpg",
  },
];

// ──────────────────────────── Products ────────────────────────────

type ProductSeed = {
  slug: string;
  category: CategorySlug;
  name: LocalizedText;
  description: LocalizedText;
  ingredients: LocalizedText;
  price: number;
  discountPrice?: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  weightGrams: number;
  stock: number;
  shelfLifeDays: number;
  isFeatured?: boolean;
};

const BASE_INGREDIENTS = {
  fa: "آرد گندم، شکر، روغن گیاهی، تخم‌مرغ",
  en: "Wheat flour, sugar, vegetable oil, eggs",
  ar: "دقيق القمح، سكر، زيت نباتي، بيض",
} as const;

function ingredients(extra: LocalizedText): LocalizedText {
  return {
    fa: `${BASE_INGREDIENTS.fa}، ${extra.fa}`,
    en: `${BASE_INGREDIENTS.en}, ${extra.en}`,
    ar: `${BASE_INGREDIENTS.ar}، ${extra.ar}`,
  };
}

const products: ProductSeed[] = [
  // Koloocheh
  {
    slug: "walnut-koloocheh-450g",
    category: "koloocheh",
    name: {
      fa: "کلوچه گردویی ۴۵۰ گرمی",
      en: "Walnut Koloocheh 450 g",
      ar: "كلوجة بالجوز ٤٥٠ غ",
    },
    description: {
      fa: "کلوچه گرد و نرم با مغزی گردو و دارچین و یک نیم‌گردوی کامل روی هر دانه. بسته ۸ عددی، پخت روز.",
      en: "Soft round cookies with a walnut-cinnamon filling and a walnut half on top of each. Box of 8, baked fresh daily.",
      ar: "كعك مستدير طري بحشوة الجوز والقرفة تعلو كل قطعة نصف حبة جوز. علبة من ٨ قطع، تُخبز يوميًا.",
    },
    ingredients: ingredients({
      fa: "گردو، دارچین، هل، وانیل",
      en: "walnuts, cinnamon, cardamom, vanilla",
      ar: "جوز، قرفة، هيل، فانيليا",
    }),
    price: 195000,
    discountPrice: 179000,
    wholesalePrice: 152000,
    minWholesaleQty: 24,
    weightGrams: 450,
    stock: 240,
    shelfLifeDays: 60,
    isFeatured: true,
  },
  {
    slug: "plain-koloocheh-400g",
    category: "koloocheh",
    name: {
      fa: "کلوچه ساده ۴۰۰ گرمی",
      en: "Plain Koloocheh 400 g",
      ar: "كلوجة سادة ٤٠٠ غ",
    },
    description: {
      fa: "کلوچه کلاسیک با مغزی شکر و دارچین؛ همراه همیشگی چای عصرانه. بسته ۸ عددی.",
      en: "The classic koloocheh with a sugar-cinnamon filling — the perfect companion to afternoon tea. Box of 8.",
      ar: "الكلوجة الكلاسيكية بحشوة السكر والقرفة، الرفيق المثالي لشاي العصر. علبة من ٨ قطع.",
    },
    ingredients: ingredients({
      fa: "دارچین، هل، وانیل",
      en: "cinnamon, cardamom, vanilla",
      ar: "قرفة، هيل، فانيليا",
    }),
    price: 149000,
    wholesalePrice: 118000,
    minWholesaleQty: 24,
    weightGrams: 400,
    stock: 300,
    shelfLifeDays: 60,
  },
  {
    slug: "coconut-koloocheh-450g",
    category: "koloocheh",
    name: {
      fa: "کلوچه نارگیلی ۴۵۰ گرمی",
      en: "Coconut Koloocheh 450 g",
      ar: "كلوجة بجوز الهند ٤٥٠ غ",
    },
    description: {
      fa: "کلوچه نرم با مغزی نارگیل تازه و عطر ملایم وانیل. بسته ۸ عددی.",
      en: "Soft koloocheh filled with fresh coconut and a gentle hint of vanilla. Box of 8.",
      ar: "كلوجة طرية محشوة بجوز الهند الطازج مع لمسة خفيفة من الفانيليا. علبة من ٨ قطع.",
    },
    ingredients: ingredients({
      fa: "پودر نارگیل، وانیل",
      en: "desiccated coconut, vanilla",
      ar: "جوز الهند المبشور، فانيليا",
    }),
    price: 172000,
    wholesalePrice: 136000,
    minWholesaleQty: 24,
    weightGrams: 450,
    stock: 180,
    shelfLifeDays: 60,
    isFeatured: true,
  },
  {
    slug: "cinnamon-koloocheh-450g",
    category: "koloocheh",
    name: {
      fa: "کلوچه دارچینی ۴۵۰ گرمی",
      en: "Cinnamon Koloocheh 450 g",
      ar: "كلوجة بالقرفة ٤٥٠ غ",
    },
    description: {
      fa: "برای دوستداران طعم گرم دارچین؛ مغزی پر از دارچین سیلان و شکر قهوه‌ای. بسته ۸ عددی.",
      en: "For lovers of warm spice: a generous Ceylon cinnamon and brown sugar filling. Box of 8.",
      ar: "لمحبي النكهات الدافئة: حشوة غنية بالقرفة السيلانية والسكر البني. علبة من ٨ قطع.",
    },
    ingredients: ingredients({
      fa: "دارچین، شکر قهوه‌ای، هل",
      en: "cinnamon, brown sugar, cardamom",
      ar: "قرفة، سكر بني، هيل",
    }),
    price: 165000,
    wholesalePrice: 130000,
    minWholesaleQty: 24,
    weightGrams: 450,
    // Deliberately sold out, to exercise the out-of-stock state.
    stock: 0,
    shelfLifeDays: 60,
  },
  {
    slug: "mini-walnut-koloocheh-250g",
    category: "koloocheh",
    name: {
      fa: "کلوچه گردویی مینی ۲۵۰ گرمی",
      en: "Mini Walnut Koloocheh 250 g",
      ar: "ميني كلوجة بالجوز ٢٥٠ غ",
    },
    description: {
      fa: "کلوچه‌های کوچک یک‌لقمه‌ای با مغز گردو؛ مناسب پذیرایی و میان‌وعده. بسته ۱۲ عددی.",
      en: "Bite-size walnut koloocheh, ideal for serving guests or snacking. Pack of 12.",
      ar: "قطع صغيرة بحجم اللقمة من الكلوجة بالجوز، مثالية للضيافة والوجبات الخفيفة. عبوة من ١٢ قطعة.",
    },
    ingredients: ingredients({
      fa: "گردو، دارچین، وانیل",
      en: "walnuts, cinnamon, vanilla",
      ar: "جوز، قرفة، فانيليا",
    }),
    price: 118000,
    wholesalePrice: 94000,
    minWholesaleQty: 36,
    weightGrams: 250,
    stock: 200,
    shelfLifeDays: 60,
  },

  // Kolompeh
  {
    slug: "date-kolompeh-500g",
    category: "kolompeh",
    name: {
      fa: "کلمپه خرمایی ۵۰۰ گرمی",
      en: "Date Kolompeh 500 g",
      ar: "كلمبة بالتمر ٥٠٠ غ",
    },
    description: {
      fa: "کلمپه سنتی کرمان با مغز خرمای مضافتی بم، هل و دارچین و روکش کنجد. بسته ۱۰ عددی.",
      en: "Traditional Kerman kolompeh filled with Mazafati dates from Bam, cardamom and cinnamon, topped with sesame. Box of 10.",
      ar: "كلمبة كرمانية تقليدية محشوة بتمر المضافتي من بم مع الهيل والقرفة ومغطاة بالسمسم. علبة من ١٠ قطع.",
    },
    ingredients: ingredients({
      fa: "خرمای مضافتی، کنجد، هل، دارچین",
      en: "Mazafati dates, sesame, cardamom, cinnamon",
      ar: "تمر المضافتي، سمسم، هيل، قرفة",
    }),
    price: 215000,
    discountPrice: 198000,
    wholesalePrice: 168000,
    minWholesaleQty: 20,
    weightGrams: 500,
    stock: 260,
    shelfLifeDays: 90,
    isFeatured: true,
  },
  {
    slug: "date-walnut-kolompeh-500g",
    category: "kolompeh",
    name: {
      fa: "کلمپه خرما و گردو ۵۰۰ گرمی",
      en: "Date & Walnut Kolompeh 500 g",
      ar: "كلمبة بالتمر والجوز ٥٠٠ غ",
    },
    description: {
      fa: "کلمپه مخصوص با مغز خرما و تکه‌های گردو؛ ترکیبی مقوی و خوش‌طعم. بسته ۱۰ عددی.",
      en: "Our special kolompeh: date filling studded with walnut pieces — rich and satisfying. Box of 10.",
      ar: "كلمبة مميزة بحشوة التمر وقطع الجوز؛ مزيج غني ولذيذ. علبة من ١٠ قطع.",
    },
    ingredients: ingredients({
      fa: "خرما، گردو، کنجد، هل، دارچین",
      en: "dates, walnuts, sesame, cardamom, cinnamon",
      ar: "تمر، جوز، سمسم، هيل، قرفة",
    }),
    price: 248000,
    wholesalePrice: 196000,
    minWholesaleQty: 20,
    weightGrams: 500,
    stock: 160,
    shelfLifeDays: 90,
  },
  {
    slug: "saffron-pistachio-kolompeh-400g",
    category: "kolompeh",
    name: {
      fa: "کلمپه زعفرانی با پسته ۴۰۰ گرمی",
      en: "Saffron & Pistachio Kolompeh 400 g",
      ar: "كلمبة بالزعفران والفستق ٤٠٠ غ",
    },
    description: {
      fa: "خمیر زعفرانی با مغز خرما و تزئین خلال پسته کرمان؛ انتخابی ویژه برای پذیرایی. بسته ۸ عددی.",
      en: "Saffron dough with a date filling, decorated with slivered Kerman pistachios — a special choice for guests. Box of 8.",
      ar: "عجينة بالزعفران محشوة بالتمر ومزينة بشرائح فستق كرمان؛ خيار مميز للضيافة. علبة من ٨ قطع.",
    },
    ingredients: ingredients({
      fa: "خرما، زعفران، پسته، هل",
      en: "dates, saffron, pistachios, cardamom",
      ar: "تمر، زعفران، فستق، هيل",
    }),
    price: 298000,
    wholesalePrice: 240000,
    minWholesaleQty: 20,
    weightGrams: 400,
    stock: 90,
    shelfLifeDays: 90,
    isFeatured: true,
  },

  // Gift boxes
  {
    slug: "nowruz-gift-box-1200g",
    category: "gift-boxes",
    name: {
      fa: "جعبه هدیه نوروزی ۱۲۰۰ گرمی",
      en: "Nowruz Gift Box 1.2 kg",
      ar: "علبة هدايا النوروز ١٫٢ كغ",
    },
    description: {
      fa: "گلچینی از کلوچه گردویی، نارگیلی و کلمپه خرمایی در جعبه‌ای با طرح نوروز؛ ۲۴ عدد.",
      en: "A selection of walnut and coconut koloocheh with date kolompeh in a Nowruz-themed box; 24 pieces.",
      ar: "تشكيلة من الكلوجة بالجوز وبجوز الهند والكلمبة بالتمر في علبة بتصميم النوروز؛ ٢٤ قطعة.",
    },
    ingredients: ingredients({
      fa: "گردو، نارگیل، خرما، کنجد، دارچین، هل",
      en: "walnuts, coconut, dates, sesame, cinnamon, cardamom",
      ar: "جوز، جوز الهند، تمر، سمسم، قرفة، هيل",
    }),
    price: 590000,
    discountPrice: 545000,
    weightGrams: 1200,
    stock: 80,
    shelfLifeDays: 60,
    isFeatured: true,
  },
  {
    slug: "mixed-gift-box-900g",
    category: "gift-boxes",
    name: {
      fa: "جعبه هدیه میکس ۹۰۰ گرمی",
      en: "Mixed Gift Box 900 g",
      ar: "علبة هدايا مشكلة ٩٠٠ غ",
    },
    description: {
      fa: "ترکیبی از چهار طعم پرطرفدار کلوچه و کلمپه در جعبه‌ای شکیل؛ ۱۸ عدد.",
      en: "Four best-loved koloocheh and kolompeh flavours in an elegant box; 18 pieces.",
      ar: "أربع نكهات مفضلة من الكلوجة والكلمبة في علبة أنيقة؛ ١٨ قطعة.",
    },
    ingredients: ingredients({
      fa: "گردو، نارگیل، خرما، کنجد، دارچین",
      en: "walnuts, coconut, dates, sesame, cinnamon",
      ar: "جوز، جوز الهند، تمر، سمسم، قرفة",
    }),
    price: 435000,
    weightGrams: 900,
    stock: 110,
    shelfLifeDays: 60,
  },
  {
    slug: "luxury-gift-tin-700g",
    category: "gift-boxes",
    name: {
      fa: "قوطی فلزی نفیس ۷۰۰ گرمی",
      en: "Luxury Gift Tin 700 g",
      ar: "علبة معدنية فاخرة ٧٠٠ غ",
    },
    description: {
      fa: "کلمپه زعفرانی و کلوچه گردویی در قوطی فلزی ماندگار با نقش سنتی؛ هدیه‌ای ماندنی. ۱۴ عدد.",
      en: "Saffron kolompeh and walnut koloocheh in a keepsake tin with a traditional pattern; 14 pieces.",
      ar: "كلمبة بالزعفران وكلوجة بالجوز في علبة معدنية تذكارية بنقش تقليدي؛ ١٤ قطعة.",
    },
    ingredients: ingredients({
      fa: "گردو، خرما، زعفران، پسته، هل",
      en: "walnuts, dates, saffron, pistachios, cardamom",
      ar: "جوز، تمر، زعفران، فستق، هيل",
    }),
    price: 520000,
    weightGrams: 700,
    stock: 60,
    shelfLifeDays: 90,
  },

  // Wholesale packs
  {
    slug: "walnut-koloocheh-carton-5kg",
    category: "wholesale-packs",
    name: {
      fa: "کارتن کلوچه گردویی ۵ کیلویی",
      en: "Walnut Koloocheh Carton 5 kg",
      ar: "كرتون كلوجة بالجوز ٥ كغ",
    },
    description: {
      fa: "کارتن فله کلوچه گردویی با بسته‌بندی تکی؛ حدود ۹۰ عدد. مناسب فروشگاه و کافه.",
      en: "Bulk carton of individually wrapped walnut koloocheh, about 90 pieces. For shops and cafés.",
      ar: "كرتون جملة من الكلوجة بالجوز المغلفة فرديًا، نحو ٩٠ قطعة. للمتاجر والمقاهي.",
    },
    ingredients: ingredients({
      fa: "گردو، دارچین، هل، وانیل",
      en: "walnuts, cinnamon, cardamom, vanilla",
      ar: "جوز، قرفة، هيل، فانيليا",
    }),
    price: 1950000,
    wholesalePrice: 1690000,
    minWholesaleQty: 5,
    weightGrams: 5000,
    stock: 70,
    shelfLifeDays: 60,
  },
  {
    slug: "date-kolompeh-carton-5kg",
    category: "wholesale-packs",
    name: {
      fa: "کارتن کلمپه خرمایی ۵ کیلویی",
      en: "Date Kolompeh Carton 5 kg",
      ar: "كرتون كلمبة بالتمر ٥ كغ",
    },
    description: {
      fa: "کارتن فله کلمپه خرمایی با بسته‌بندی تکی؛ حدود ۱۰۰ عدد. ماندگاری بالا برای توزیع.",
      en: "Bulk carton of individually wrapped date kolompeh, about 100 pieces. Long shelf life for distribution.",
      ar: "كرتون جملة من الكلمبة بالتمر المغلفة فرديًا، نحو ١٠٠ قطعة. صلاحية طويلة مناسبة للتوزيع.",
    },
    ingredients: ingredients({
      fa: "خرما، کنجد، هل، دارچین",
      en: "dates, sesame, cardamom, cinnamon",
      ar: "تمر، سمسم، هيل، قرفة",
    }),
    price: 2050000,
    wholesalePrice: 1780000,
    minWholesaleQty: 5,
    weightGrams: 5000,
    stock: 65,
    shelfLifeDays: 90,
  },
  {
    slug: "mixed-carton-10kg",
    category: "wholesale-packs",
    name: {
      fa: "کارتن میکس ۱۰ کیلویی",
      en: "Mixed Carton 10 kg",
      ar: "كرتون مشكل ١٠ كغ",
    },
    description: {
      fa: "ترکیب کلوچه گردویی، نارگیلی، ساده و کلمپه خرمایی در یک کارتن؛ بهترین انتخاب برای شروع همکاری.",
      en: "Walnut, coconut and plain koloocheh with date kolompeh in one carton — the best way to start stocking our range.",
      ar: "كلوجة بالجوز وبجوز الهند وسادة مع كلمبة بالتمر في كرتون واحد؛ أفضل بداية للتعامل معنا.",
    },
    ingredients: ingredients({
      fa: "گردو، نارگیل، خرما، کنجد، دارچین، هل",
      en: "walnuts, coconut, dates, sesame, cinnamon, cardamom",
      ar: "جوز، جوز الهند، تمر، سمسم، قرفة، هيل",
    }),
    price: 3850000,
    wholesalePrice: 3320000,
    minWholesaleQty: 3,
    weightGrams: 10000,
    stock: 40,
    shelfLifeDays: 60,
  },
];

// ───────────────────────────── Reviews ─────────────────────────────
// Sample customers and reviews so ratings and testimonials have content
// in development. Phone numbers are placeholders.

const sampleCustomers = [
  { phone: "09120000001", name: "مریم احمدی" },
  { phone: "09120000002", name: "علی رضایی" },
  { phone: "09120000003", name: "سارا کریمی" },
  { phone: "09120000004", name: "حسین موسوی" },
];

const sampleReviews: {
  product: string;
  customer: string;
  rating: number;
  comment: string;
}[] = [
  {
    product: "walnut-koloocheh-450g",
    customer: "09120000001",
    rating: 5,
    comment: "تازه و خوش‌عطر بود، مغز گردوی فراوانی داشت. بسته‌بندی هم عالی بود.",
  },
  {
    product: "walnut-koloocheh-450g",
    customer: "09120000002",
    rating: 4,
    comment: "طعم خیلی خوبی دارد، فقط کمی شیرین‌تر از سلیقه من بود.",
  },
  {
    product: "date-kolompeh-500g",
    customer: "09120000003",
    rating: 5,
    comment: "دقیقاً همان طعم کلمپه‌های کرمان؛ خرمای باکیفیت و عطر هل.",
  },
  {
    product: "date-kolompeh-500g",
    customer: "09120000004",
    rating: 5,
    comment: "برای مهمان‌ها سفارش دادم و همه پسندیدند. ارسال هم سریع بود.",
  },
  {
    product: "coconut-koloocheh-450g",
    customer: "09120000002",
    rating: 4,
    comment: "نرم و تازه؛ با چای عصرانه عالی است.",
  },
  {
    product: "nowruz-gift-box-1200g",
    customer: "09120000001",
    rating: 5,
    comment: "جعبه بسیار شکیلی بود و به‌موقع برای عید رسید. هدیه‌ای آبرومند.",
  },
  {
    product: "saffron-pistachio-kolompeh-400g",
    customer: "09120000003",
    rating: 5,
    comment: "عطر زعفران و پسته فوق‌العاده است. حتماً دوباره می‌خرم.",
  },
  {
    product: "plain-koloocheh-400g",
    customer: "09120000004",
    rating: 4,
    comment: "ساده و خوشمزه، قیمت مناسبی هم دارد.",
  },
];

// ───────────────────────────── Dealers ─────────────────────────────
// Fictional sample dealers. Phone numbers use placeholder digits.

const OPEN_DAILY: LocalizedText = {
  fa: "شنبه تا پنجشنبه ۹ تا ۲۱، جمعه ۱۰ تا ۱۴",
  en: "Sat–Thu 9:00–21:00, Fri 10:00–14:00",
  ar: "السبت–الخميس ٩:٠٠–٢١:٠٠، الجمعة ١٠:٠٠–١٤:٠٠",
};

const OFFICE_HOURS: LocalizedText = {
  fa: "شنبه تا چهارشنبه ۸ تا ۱۷، پنجشنبه ۸ تا ۱۳",
  en: "Sat–Wed 8:00–17:00, Thu 8:00–13:00",
  ar: "السبت–الأربعاء ٨:٠٠–١٧:٠٠، الخميس ٨:٠٠–١٣:٠٠",
};

const dealers: {
  id: string;
  name: LocalizedText;
  type: DealerType;
  /** Location ids from src/data/iran-locations.json. */
  province: string;
  city: string;
  address: LocalizedText;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  lat: number;
  lng: number;
  openingHours: LocalizedText;
  isVerified: boolean;
}[] = [
  {
    id: "seed-dealer-tehran",
    name: {
      fa: "نمایندگی مرکزی تهران",
      en: "Tehran Central Agency",
      ar: "وكالة طهران المركزية",
    },
    type: DealerType.AGENCY,
    province: "tehran",
    city: "tehran",
    address: {
      fa: "تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۲۴۱۰",
      en: "No. 2410, Valiasr St., above Vanak Sq., Tehran",
      ar: "طهران، شارع ولي عصر، شمال ميدان ونك، رقم ٢٤١٠",
    },
    phone: "021-55500101",
    whatsapp: "+989120000101",
    instagram: "momtaz_shahd",
    lat: 35.7602,
    lng: 51.4105,
    openingHours: OPEN_DAILY,
    isVerified: true,
  },
  {
    id: "seed-dealer-kerman",
    name: {
      fa: "پخش مرکزی کرمان",
      en: "Kerman Central Distribution",
      ar: "مركز توزيع كرمان",
    },
    type: DealerType.DISTRIBUTOR,
    province: "kerman",
    city: "kerman",
    address: {
      fa: "کرمان، بلوار جمهوری اسلامی، نبش کوچه ۱۲",
      en: "Corner of Alley 12, Jomhouri Eslami Blvd., Kerman",
      ar: "كرمان، بوليفار جمهوري إسلامي، زاوية الزقاق ١٢",
    },
    phone: "034-55500102",
    whatsapp: "+989130000102",
    lat: 30.2832,
    lng: 57.0788,
    openingHours: OFFICE_HOURS,
    isVerified: true,
  },
  {
    id: "seed-dealer-isfahan",
    name: {
      fa: "فروشگاه شیرینی نقش جهان",
      en: "Naghsh-e Jahan Sweets Shop",
      ar: "متجر حلويات نقش جهان",
    },
    type: DealerType.RETAIL_STORE,
    province: "isfahan",
    city: "isfahan",
    address: {
      fa: "اصفهان، خیابان چهارباغ عباسی، روبه‌روی هشت‌بهشت",
      en: "Chaharbagh Abbasi St., opposite Hasht Behesht, Isfahan",
      ar: "أصفهان، شارع چهارباغ عباسي، مقابل هشت بهشت",
    },
    phone: "031-55500103",
    lat: 32.6539,
    lng: 51.6705,
    openingHours: OPEN_DAILY,
    isVerified: true,
  },
  {
    id: "seed-dealer-shiraz",
    name: {
      fa: "نمایندگی شیراز",
      en: "Shiraz Agency",
      ar: "وكالة شيراز",
    },
    type: DealerType.AGENCY,
    province: "fars",
    city: "shiraz",
    address: {
      fa: "شیراز، بلوار کریم‌خان زند، نرسیده به چهارراه ملاصدرا",
      en: "Karim Khan Zand Blvd., before Mulla Sadra Junction, Shiraz",
      ar: "شيراز، بوليفار كريم خان زند، قبل تقاطع ملا صدرا",
    },
    phone: "071-55500104",
    whatsapp: "+989170000104",
    lat: 29.6168,
    lng: 52.5319,
    openingHours: OPEN_DAILY,
    isVerified: true,
  },
  {
    id: "seed-dealer-mashhad",
    name: {
      fa: "پخش خراسان",
      en: "Khorasan Distribution",
      ar: "توزيع خراسان",
    },
    type: DealerType.DISTRIBUTOR,
    province: "razavi-khorasan",
    city: "mashhad",
    address: {
      fa: "مشهد، بلوار وکیل‌آباد، بین وکیل‌آباد ۲۵ و ۲۷",
      en: "Vakilabad Blvd., between Vakilabad 25 and 27, Mashhad",
      ar: "مشهد، بوليفار وكيل آباد، بين وكيل آباد ٢٥ و٢٧",
    },
    phone: "051-55500105",
    whatsapp: "+989150000105",
    lat: 36.3206,
    lng: 59.5352,
    openingHours: OFFICE_HOURS,
    isVerified: false,
  },
  {
    id: "seed-dealer-tabriz",
    name: {
      fa: "فروشگاه ائل‌گلی",
      en: "El Goli Store",
      ar: "متجر ائل غولي",
    },
    type: DealerType.RETAIL_STORE,
    province: "east-azerbaijan",
    city: "tabriz",
    address: {
      fa: "تبریز، خیابان امام خمینی، نزدیک میدان ساعت",
      en: "Imam Khomeini St., near Saat Sq., Tabriz",
      ar: "تبريز، شارع الإمام الخميني، قرب ميدان الساعة",
    },
    phone: "041-55500106",
    lat: 38.0736,
    lng: 46.2962,
    openingHours: OPEN_DAILY,
    isVerified: false,
  },
];

// ───────────────────────────── Coupons ─────────────────────────────
// Sample discount codes for development. EXPIRED2025 is deliberately expired.

const coupons = [
  { code: "WELCOME10", type: CouponType.PERCENT, value: 10, minOrder: 300000, maxUses: null, expiresAt: null },
  { code: "NOWRUZ1405", type: CouponType.FIXED, value: 50000, minOrder: 500000, maxUses: 500, expiresAt: new Date("2027-04-01T00:00:00+03:30") },
  { code: "EXPIRED2025", type: CouponType.PERCENT, value: 15, minOrder: 0, maxUses: null, expiresAt: new Date("2025-12-31T23:59:59+03:30") },
];

// ───────────────────────────── Settings ─────────────────────────────

const settings: Record<string, object> = {
  // Toman. Each extra started kg above `baseWeightGrams` costs `perExtraKg`.
  // `inProvince` applies when the destination is in the origin province.
  // Method names are translated in the message files, keyed by `id`.
  // SAMPLE RATES and a placeholder origin: set the real ones before launch.
  shipping: {
    schemaVersion: 2,
    origin: { province: "tehran", city: "tehran" },
    pickupAddress: {
      fa: "تهران، نشانی کارخانه به‌زودی اعلام می‌شود",
      en: "Tehran — factory address will be published soon",
      ar: "طهران — سيُنشر عنوان المصنع قريبًا",
    },
    methods: [
      {
        id: "post",
        isActive: true,
        baseWeightGrams: 1000,
        inProvince: { baseCost: 55000, perExtraKg: 15000 },
        outOfProvince: { baseCost: 75000, perExtraKg: 20000 },
        sameCityOnly: false,
        estimatedDays: { min: 2, max: 5 },
      },
      {
        id: "tipax",
        isActive: true,
        baseWeightGrams: 1000,
        inProvince: { baseCost: 85000, perExtraKg: 20000 },
        outOfProvince: { baseCost: 110000, perExtraKg: 28000 },
        sameCityOnly: false,
        estimatedDays: { min: 1, max: 3 },
      },
      {
        id: "courier",
        isActive: true,
        baseWeightGrams: 5000,
        inProvince: { baseCost: 80000, perExtraKg: 10000 },
        outOfProvince: null,
        sameCityOnly: true,
        estimatedDays: { min: 0, max: 1 },
      },
      {
        id: "pickup",
        isActive: true,
        baseWeightGrams: 0,
        inProvince: { baseCost: 0, perExtraKg: 0 },
        outOfProvince: { baseCost: 0, perExtraKg: 0 },
        sameCityOnly: false,
        estimatedDays: { min: 1, max: 1 },
      },
    ],
  },
  // Orders with a subtotal at or above this amount (Toman) ship free.
  freeShipping: { enabled: true, threshold: 1500000 },
  // How many Toman one unit of each currency is worth. SAMPLE VALUES —
  // the admin must set real rates before prices are shown in USD/AED.
  exchangeRates: {
    base: "IRT",
    rates: { USD: 100000, AED: 27200 },
    showApproximate: true,
    updatedAt: null,
  },
  // Placeholder contact details.
  contact: {
    phone: "+98 21 0000 0000",
    whatsapp: "+989120000000",
    email: "info@example.com",
    instagram: "momtaz_shahd",
    address: {
      fa: "نشانی کارخانه به‌زودی اعلام می‌شود",
      en: "Factory address will be published soon",
      ar: "سيُنشر عنوان المصنع قريبًا",
    },
    workingHours: OFFICE_HOURS,
  },
  // PLACEHOLDER account details for bank transfers (wholesale orders).
  bankTransfer: {
    bankName: { fa: "نام بانک", en: "Bank name", ar: "اسم البنك" },
    accountHolder: { fa: "شرکت ممتاز شهد", en: "Momtaz Shahd Co.", ar: "شركة ممتاز شهد" },
    sheba: "IR000000000000000000000000",
    cardNumber: "0000-0000-0000-0000",
  },
  announcementBanner: {
    enabled: true,
    text: {
      fa: "ارسال رایگان برای خریدهای بالای ۱٬۵۰۰٬۰۰۰ تومان",
      en: "Free shipping on orders over 1,500,000 Toman",
      ar: "شحن مجاني للطلبات التي تزيد على ١٬٥٠٠٬٠٠٠ تومان",
    },
    link: "/products",
  },
};

// ────────────────────────────── Run ──────────────────────────────

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN.password, 12);
  await prisma.user.upsert({
    where: { phone: ADMIN.phone },
    // Never overwrite an existing admin's password or profile on re-seed.
    update: { role: Role.ADMIN },
    create: {
      phone: ADMIN.phone,
      name: ADMIN.name,
      passwordHash,
      role: Role.ADMIN,
      preferredLocale: "fa",
    },
  });

  const categoryIds = new Map<CategorySlug, string>();
  for (const [index, category] of categories.entries()) {
    const data = {
      name: category.name,
      description: category.description,
      image: category.image,
      sortOrder: index + 1,
    };
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: data,
      create: { slug: category.slug, ...data },
    });
    categoryIds.set(category.slug, saved.id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Unknown category: ${product.category}`);

    const data = {
      name: product.name,
      description: product.description,
      ingredients: product.ingredients,
      categoryId,
      price: product.price,
      discountPrice: product.discountPrice ?? null,
      wholesalePrice: product.wholesalePrice ?? null,
      minWholesaleQty: product.minWholesaleQty ?? null,
      weightGrams: product.weightGrams,
      stock: product.stock,
      // Drop photos with these names into public/products; until then the
      // storefront shows the cream placeholder (see public/products/README.md).
      images: [
        `/products/${product.slug}-1.jpg`,
        `/products/${product.slug}-2.jpg`,
      ],
      shelfLifeDays: product.shelfLifeDays,
      isActive: true,
      isFeatured: product.isFeatured ?? false,
    };
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: data,
      create: { slug: product.slug, ...data },
    });
  }

  const customerIds = new Map<string, string>();
  for (const customer of sampleCustomers) {
    const saved = await prisma.user.upsert({
      where: { phone: customer.phone },
      update: {},
      create: { ...customer, role: Role.CUSTOMER, preferredLocale: "fa" },
    });
    customerIds.set(customer.phone, saved.id);
  }

  for (const review of sampleReviews) {
    const userId = customerIds.get(review.customer);
    const product = await prisma.product.findUnique({
      where: { slug: review.product },
      select: { id: true },
    });
    if (!userId || !product) throw new Error(`Bad review seed: ${review.product}`);

    await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId } },
      update: {},
      create: {
        productId: product.id,
        userId,
        rating: review.rating,
        comment: review.comment,
        isApproved: true,
      },
    });
  }

  for (const { id, whatsapp, instagram, ...dealer } of dealers) {
    const data = {
      ...dealer,
      country: "IR",
      whatsapp: whatsapp ?? null,
      instagram: instagram ?? null,
      isActive: true,
    };
    await prisma.dealer.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      // Keep usage counts and any edits made in the admin panel.
      update: {},
      create: coupon,
    });
  }

  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    // Keep values an admin has already changed, unless the stored value uses
    // an older format than this seed (`schemaVersion`), which the app can no
    // longer read.
    const seedVersion = "schemaVersion" in value ? value.schemaVersion : undefined;
    const storedVersion =
      existing && typeof existing.value === "object" && existing.value !== null &&
      "schemaVersion" in existing.value
        ? existing.value.schemaVersion
        : undefined;
    if (existing && seedVersion === storedVersion) continue;
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  const [
    userCount,
    categoryCount,
    productCount,
    reviewCount,
    dealerCount,
    couponCount,
    settingCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.review.count(),
    prisma.dealer.count(),
    prisma.coupon.count(),
    prisma.setting.count(),
  ]);

  console.log(
    `Seed complete: ${userCount} user(s), ${categoryCount} categories, ` +
      `${productCount} products, ${reviewCount} reviews, ${dealerCount} dealers, ${couponCount} coupons, ${settingCount} settings.`,
  );
  console.log(
    `Admin login: ${ADMIN.phone} / ${ADMIN.password} — change this password before going live.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
