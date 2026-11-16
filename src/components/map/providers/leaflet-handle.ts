import type * as Leaflet from "leaflet";

import type { MapEvents, MapHandle, MapMarker } from "./types";

type LeafletLib = typeof Leaflet;

function markerIcon(L: LeafletLib, marker: MapMarker): Leaflet.DivIcon {
  if (marker.kind === "cluster") {
    const count = marker.count ?? 0;
    const size = count >= 50 ? 52 : count >= 10 ? 44 : 38;
    return L.divIcon({
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:9999px;background:#c8102e;color:#fff;font:600 13px/1 system-ui,sans-serif;border:3px solid #fff;box-shadow:0 0 0 4px rgba(200,16,46,.25),0 2px 6px rgba(0,0,0,.25)">${count}</span>`,
    });
  }
  if (marker.kind === "user") {
    return L.divIcon({
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25)"></span>',
    });
  }
  const scale = marker.selected ? 1.25 : 1;
  const fill = marker.highlighted ? "#b8763e" : "#c8102e";
  const width = Math.round(32 * scale);
  const height = Math.round(40 * scale);
  return L.divIcon({
    className: "",
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 4],
    html: `<svg width="${width}" height="${height}" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 39s13-13.4 13-23A13 13 0 0 0 3 16c0 9.6 13 23 13 23z" fill="${fill}" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>`,
  });
}

/**
 * The MapHandle for any Leaflet-compatible map. Neshan's web SDK is built on
 * Leaflet, so both providers share this code; only map creation differs.
 */
export function createLeafletHandle(
  L: LeafletLib,
  map: Leaflet.Map,
  events: MapEvents,
  provider: MapHandle["provider"],
): MapHandle {
  const layer = L.layerGroup().addTo(map);
  const placeMarkers = new Map<string, Leaflet.Marker>();
  let popup: Leaflet.Popup | null = null;
  let openId: string | null = null;
  // Redrawing removes the marker a popup sits on; that is not the user closing it.
  let redrawing = false;

  map.on("moveend", () => events.onViewChange());

  return {
    provider,
    setMarkers(markers) {
      redrawing = true;
      layer.clearLayers();
      placeMarkers.clear();
      for (const spec of markers) {
        const marker = L.marker([spec.lat, spec.lng], {
          icon: markerIcon(L, spec),
          title: spec.label,
          alt: spec.label,
          keyboard: spec.kind !== "user",
          zIndexOffset: spec.selected ? 1000 : spec.kind === "cluster" ? 500 : 0,
        });
        // divIcons are plain elements: give them an accessible name and role.
        marker.on("add", () => {
          const element = marker.getElement();
          if (!element) return;
          element.setAttribute("aria-label", spec.label);
          if (spec.kind !== "user") element.setAttribute("role", "button");
        });
        if (spec.kind !== "user") marker.on("click keypress", () => events.onMarkerClick(spec));
        marker.addTo(layer);
        if (spec.kind === "place") placeMarkers.set(spec.id, marker);
      }
      const target = openId ? placeMarkers.get(openId) : undefined;
      if (target && popup) target.bindPopup(popup).openPopup();
      redrawing = false;
      // The open place is now inside a cluster (or filtered out): its popup is gone.
      if (openId && !target) {
        openId = null;
        events.onPopupClose();
      }
    },
    flyTo(point, zoom) {
      map.flyTo([point.lat, point.lng], zoom ?? map.getZoom(), { duration: 0.6 });
    },
    fitTo(points) {
      if (points.length === 0) return;
      if (points.length === 1) {
        const [only] = points;
        if (only) map.setView([only.lat, only.lng], 14);
        return;
      }
      map.fitBounds(L.latLngBounds(points.map((point) => [point.lat, point.lng])), { padding: [40, 40], maxZoom: 14 });
    },
    getView() {
      const bounds = map.getBounds();
      return { bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom: Math.round(map.getZoom()) };
    },
    openPopup(markerId, content) {
      const marker = placeMarkers.get(markerId);
      if (!marker) return false;
      if (!popup) {
        popup = L.popup({ maxWidth: 300, minWidth: 220, autoPanPadding: [24, 24], className: "dealer-popup" });
        popup.on("remove", () => {
          if (redrawing) return;
          openId = null;
          events.onPopupClose();
        });
      }
      popup.setContent(content);
      openId = markerId;
      marker.bindPopup(popup).openPopup();
      return true;
    },
    closePopup() {
      openId = null;
      map.closePopup();
    },
    resize() {
      map.invalidateSize();
    },
    destroy() {
      map.off();
      map.remove();
    },
  };
}
