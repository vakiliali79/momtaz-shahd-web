import data from "@/data/iran-locations.json";
import type { AppLocale } from "@/i18n/routing";
import type { LocalizedText } from "@/lib/localized";

/**
 * Iranian provinces and their main cities (src/data/iran-locations.json).
 * Addresses store the ids; labels come from here in the visitor's language.
 * To add a city, append it to the JSON with a unique id within its province.
 */

export type City = { id: string; name: LocalizedText };
export type Province = {
  id: string;
  name: LocalizedText;
  /** [lat, lng] of the provincial capital, used to centre the map. */
  center: [number, number];
  cities: City[];
};

export const provinces: readonly Province[] = data.provinces.map((province) => ({
  id: province.id,
  name: province.name,
  center: [province.center[0] ?? 32.4, province.center[1] ?? 53.7],
  cities: province.cities,
}));

/** Rough centre of Iran, for a map with no province selected. */
export const IRAN_CENTER: [number, number] = [32.4, 53.7];

export function getProvince(id: string): Province | undefined {
  return provinces.find((province) => province.id === id);
}

export function getCity(provinceId: string, cityId: string): City | undefined {
  return getProvince(provinceId)?.cities.find((city) => city.id === cityId);
}

export function sortedProvinces(locale: AppLocale): Province[] {
  const collator = new Intl.Collator(locale);
  return [...provinces].sort((a, b) => collator.compare(a.name[locale], b.name[locale]));
}

export function sortedCities(province: Province, locale: AppLocale): City[] {
  const collator = new Intl.Collator(locale);
  return [...province.cities].sort((a, b) => collator.compare(a.name[locale], b.name[locale]));
}
