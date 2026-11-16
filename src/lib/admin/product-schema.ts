import { z } from "zod";

import {
  count,
  imageUrlSchema,
  localizedOptional,
  localizedRequired,
  money,
  optionalMoney,
  slugSchema,
} from "@/lib/admin/validation";

/** Shared by the admin product form and its server action. */
export const productSchema = z
  .object({
    slug: slugSchema,
    categoryId: z.string().min(1, "required"),
    name: localizedRequired(120),
    description: localizedRequired(2000),
    ingredients: localizedOptional(1000),
    price: money,
    discountPrice: optionalMoney,
    wholesalePrice: optionalMoney,
    minWholesaleQty: count.nullable(),
    weightGrams: z.number({ error: "required" }).int("mustBeWhole").min(1, "mustBePositive").max(1_000_000, "tooLong"),
    stock: count,
    shelfLifeDays: count.nullable(),
    images: z.array(imageUrlSchema).max(8, "tooLong"),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discountPrice !== null && data.discountPrice >= data.price) {
      ctx.addIssue({ code: "custom", path: ["discountPrice"], message: "discountTooHigh" });
    }
    if ((data.wholesalePrice === null) !== (data.minWholesaleQty === null)) {
      ctx.addIssue({ code: "custom", path: ["wholesalePrice"], message: "wholesaleIncomplete" });
    }
    if (data.wholesalePrice !== null && data.wholesalePrice >= data.price) {
      ctx.addIssue({ code: "custom", path: ["wholesalePrice"], message: "discountTooHigh" });
    }
  });

export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
