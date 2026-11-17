import "server-only";

import type { AppLocale } from "@/i18n/routing";
import type { DealerInput } from "@/lib/admin/dealer-schema";
import { resolveImage } from "@/lib/data/images";
import { db } from "@/lib/db";
import { localize, toLocalizedText } from "@/lib/localized";
import { getCity, getProvince } from "@/lib/locations";

export type AdminDealerRow = {
  id: string;
  name: string;
  type: "DISTRIBUTOR" | "RETAIL_STORE" | "AGENCY";
  place: { province: string; city: string };
  phone: string | null;
  hasLocation: boolean;
  isActive: boolean;
  isVerified: boolean;
  image: string;
};

export async function listAdminDealers(locale: AppLocale): Promise<AdminDealerRow[]> {
  const dealers = await db.dealer.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] });
  return dealers.map((dealer) => ({
    id: dealer.id,
    name: localize(dealer.name, locale),
    type: dealer.type,
    place: {
      province: getProvince(dealer.province)?.name[locale] ?? dealer.province,
      city: getCity(dealer.province, dealer.city)?.name[locale] ?? dealer.city,
    },
    phone: dealer.phone,
    hasLocation: dealer.lat !== null && dealer.lng !== null,
    isActive: dealer.isActive,
    isVerified: dealer.isVerified,
    image: resolveImage(dealer.image),
  }));
}

export async function getDealerForEdit(id: string): Promise<DealerInput | null> {
  const dealer = await db.dealer.findUnique({ where: { id } });
  if (!dealer) return null;
  return {
    name: toLocalizedText(dealer.name),
    address: toLocalizedText(dealer.address),
    openingHours: toLocalizedText(dealer.openingHours),
    type: dealer.type,
    province: dealer.province,
    city: dealer.city,
    phone: dealer.phone ?? "",
    whatsapp: dealer.whatsapp ?? "",
    instagram: dealer.instagram ?? "",
    location: dealer.lat !== null && dealer.lng !== null ? { lat: dealer.lat, lng: dealer.lng } : null,
    images: dealer.image ? [dealer.image] : [],
    isActive: dealer.isActive,
    isVerified: dealer.isVerified,
  };
}
