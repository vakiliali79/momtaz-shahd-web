import { leafletProvider } from "./leaflet-provider";
import { neshanProvider } from "./neshan-provider";
import type { MapProvider } from "./types";

/**
 * Neshan when NEXT_PUBLIC_NESHAN_KEY is set, otherwise Leaflet + OpenStreetMap.
 * If Neshan fails to load (network, bad key), the map falls back to Leaflet.
 */
export async function createMap(...args: Parameters<MapProvider["create"]>) {
  const key = process.env.NEXT_PUBLIC_NESHAN_KEY;
  if (key) {
    try {
      return await neshanProvider(key).create(...args);
    } catch (error) {
      console.warn("[map] Neshan unavailable, using OpenStreetMap:", error);
    }
  }
  return leafletProvider.create(...args);
}

export type { LatLng, MapHandle, MapMarker } from "./types";
