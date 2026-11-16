import { z } from "zod";

import { count, imageUrlSchema, localizedOptional, localizedRequired, slugSchema } from "@/lib/admin/validation";

export const categorySchema = z.object({
  slug: slugSchema,
  name: localizedRequired(80),
  description: localizedOptional(600),
  /** At most one image; an array so the shared uploader can be used. */
  images: z.array(imageUrlSchema).max(1, "tooLong"),
  sortOrder: count,
});
export type CategoryInput = z.input<typeof categorySchema>;
export type CategoryOutput = z.output<typeof categorySchema>;
