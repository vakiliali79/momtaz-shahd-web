import "leaflet/dist/leaflet.css";

import { createLeafletHandle } from "./leaflet-handle";
import type { MapProvider } from "./types";

/** Leaflet with OpenStreetMap tiles: free, no key, works everywhere. */
export const leafletProvider: MapProvider = {
  id: "leaflet",
  async create(container, options, events) {
    const L = await import("leaflet");
    const map = L.map(container, { center: options.center, zoom: options.zoom, scrollWheelZoom: true, zoomControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: options.attribution, maxZoom: 19 }).addTo(map);
    return createLeafletHandle(L, map, events, "leaflet");
  },
};
