import type { LatLng } from "@/components/map/providers/types";

export const dealerTypes = ["DISTRIBUTOR", "RETAIL_STORE", "AGENCY"] as const;
export type DealerType = (typeof dealerTypes)[number];

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Route or place links in the map apps people use in Iran. */
export function directionsLinks({ lat, lng }: LatLng) {
  const point = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${point}`,
    neshan: `https://neshan.org/maps/@${point},16z,0p`,
    balad: `https://balad.ir/location?latitude=${lat.toFixed(6)}&longitude=${lng.toFixed(6)}&zoom=16`,
  };
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const whatsappHref = (number: string) => `https://wa.me/${number.replace(/\D/g, "")}`;
export const instagramHref = (handle: string) => `https://www.instagram.com/${encodeURIComponent(handle.replace(/^@/, ""))}`;
