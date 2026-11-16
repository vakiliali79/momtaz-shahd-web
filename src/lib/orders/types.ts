import { z } from "zod";

import type { AppLocale } from "@/i18n/routing";
import { localizedTextSchema, type LocalizedText } from "@/lib/localized";

/** A saved address as sent to the browser. */
export type AddressDto = {
  id: string;
  title: string;
  province: string;
  city: string;
  fullAddress: string;
  postalCode: string;
  receiverName: string;
  receiverPhone: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

/**
 * Copy of the delivery address stored on the order, with place names in all
 * languages, so later edits to the address book or the location list never
 * change a past order.
 */
export const addressSnapshotSchema = z.object({
  title: z.string(),
  receiverName: z.string(),
  receiverPhone: z.string(),
  province: z.object({ id: z.string(), name: localizedTextSchema }),
  city: z.object({ id: z.string(), name: localizedTextSchema }),
  fullAddress: z.string(),
  postalCode: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});
export type AddressSnapshot = z.infer<typeof addressSnapshotSchema>;

export function placeName(name: LocalizedText, locale: AppLocale): string {
  return name[locale] || name.fa;
}
