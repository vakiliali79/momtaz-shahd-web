import type * as Leaflet from "leaflet";

import { createLeafletHandle } from "./leaflet-handle";
import type { MapProvider } from "./types";

/**
 * Neshan (https://platform.neshan.org) web map SDK — a Leaflet build with
 * Iranian map tiles. It is loaded from Neshan's CDN and puts its own `L` on
 * window. Needs a web map key in NEXT_PUBLIC_NESHAN_KEY.
 */
const SDK_VERSION = "v1.0.8";
const SDK_BASE = `https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/${SDK_VERSION}`;

type NeshanL = typeof Leaflet & {
  Map: new (element: HTMLElement, options: Leaflet.MapOptions & { key: string; maptype: string; poi: boolean; traffic: boolean }) => Leaflet.Map;
};

declare global {
  interface Window {
    L?: NeshanL;
  }
}

let loading: Promise<NeshanL> | null = null;

function loadSdk(): Promise<NeshanL> {
  if (window.L) return Promise.resolve(window.L);
  loading ??= new Promise<NeshanL>((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `${SDK_BASE}/index.css`;
    document.head.append(css);
    const script = document.createElement("script");
    script.src = `${SDK_BASE}/index.js`;
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Neshan SDK did not load")));
    script.onerror = () => reject(new Error("Neshan SDK could not be downloaded"));
    document.head.append(script);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

export function neshanProvider(key: string): MapProvider {
  return {
    id: "neshan",
    async create(container, options, events) {
      const L = await loadSdk();
      const map = new L.Map(container, {
        key,
        maptype: "neshan",
        poi: true,
        traffic: false,
        center: options.center,
        zoom: options.zoom,
      });
      return createLeafletHandle(L, map, events, "neshan");
    },
  };
}
