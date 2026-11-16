"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Supercluster from "supercluster";

import { createMap, type LatLng, type MapHandle, type MapMarker } from "@/components/map/providers";
import type { DealerSummary } from "@/lib/data/catalog";
import { IRAN_CENTER } from "@/lib/locations";

type Place = DealerSummary & { lat: number; lng: number };

export type DealerMapProps = {
  dealers: DealerSummary[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  userLocation: LatLng | null;
  /** Content of the popup on the selected dealer's marker. */
  renderPopup: (dealer: DealerSummary) => ReactNode;
  label: string;
  attribution: string;
  /** Text direction of the popup content. */
  dir: "rtl" | "ltr";
  /** Shown if the map cannot load (e.g. offline). */
  unavailableText: string;
  /** Accessible name of a cluster marker. */
  clusterLabel: (count: number) => string;
  /** Accessible name of the visitor's own position. */
  userLabel: string;
};

const SELECTED_ZOOM = 15;

/**
 * Dealer markers on a Neshan or OpenStreetMap map, clustered when zoomed
 * out. Browser-only: load it with next/dynamic and `ssr: false`.
 */
export default function DealerMap({ dealers, selectedId, onSelect, userLocation, renderPopup, label, attribution, dir, unavailableText, clusterLabel, userLabel }: DealerMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const [handle, setHandle] = useState<MapHandle | null>(null);
  const [failed, setFailed] = useState(false);
  const [popupElement] = useState(() => (typeof document === "undefined" ? null : document.createElement("div")));
  const pendingOpen = useRef<string | null>(null);

  const places = useMemo(
    () => dealers.filter((dealer): dealer is Place => dealer.lat !== null && dealer.lng !== null),
    [dealers],
  );
  const index = useMemo(
    () =>
      new Supercluster<{ id: string }>({ radius: 56, maxZoom: 15 }).load(
        places.map((place) => ({ type: "Feature", properties: { id: place.id }, geometry: { type: "Point", coordinates: [place.lng, place.lat] } })),
      ),
    [places],
  );

  // Latest values for the map's event callbacks, which are bound once.
  const live = useRef({ index, places, selectedId, userLocation, onSelect, label, clusterLabel, userLabel });
  useEffect(() => {
    live.current = { index, places, selectedId, userLocation, onSelect, label, clusterLabel, userLabel };
  });

  const redraw = useRef<() => void>(() => undefined);
  // Declared before the effects below, so they always call the latest version.
  useEffect(() => {
    redraw.current = () => {
      if (!handle) return;
      const view = handle.getView();
      const { index: current, places: all, selectedId: selected, userLocation: user, clusterLabel: nameCluster, userLabel: nameUser } = live.current;
      const markers: MapMarker[] = current.getClusters(view.bbox, view.zoom).map((feature) => {
        const [lng = 0, lat = 0] = feature.geometry.coordinates;
        if ("cluster" in feature.properties && feature.properties.cluster) {
          return { id: `cluster:${feature.properties.cluster_id}`, kind: "cluster", lat, lng, count: feature.properties.point_count, label: nameCluster(feature.properties.point_count) };
        }
        const id = "id" in feature.properties ? feature.properties.id : "";
        const place = all.find((entry) => entry.id === id);
        return { id, kind: "place", lat, lng, label: place?.name ?? "", highlighted: place?.isVerified === false, selected: id === selected };
      });
      if (user) markers.push({ id: "user", kind: "user", lat: user.lat, lng: user.lng, label: nameUser });
      handle.setMarkers(markers);
      const wanted = pendingOpen.current;
      if (wanted && popupElement && handle.openPopup(wanted, popupElement)) pendingOpen.current = null;
    };
  });

  // Create the map once.
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let cancelled = false;
    let created: MapHandle | null = null;
    createMap(
      element,
      { center: IRAN_CENTER, zoom: 5, label: live.current.label, attribution },
      {
        onViewChange: () => redraw.current(),
        onPopupClose: () => live.current.onSelect(null),
        onMarkerClick: (marker) => {
          if (!created) return;
          if (marker.kind === "cluster") {
            const clusterId = Number(marker.id.slice("cluster:".length));
            created.flyTo(marker, Math.min(live.current.index.getClusterExpansionZoom(clusterId), 18));
          } else if (marker.kind === "place") {
            live.current.onSelect(marker.id);
          }
        },
      },
    )
      .then((map) => {
        if (cancelled) return map.destroy();
        created = map;
        setHandle(map);
      })
      .catch((error: unknown) => {
        console.error("[map] Could not create the map:", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      created?.destroy();
    };
  }, [attribution]);

  // Keep the map sized to its box (the layout changes between phone and desktop).
  useEffect(() => {
    const element = container.current;
    if (!handle || !element) return;
    const observer = new ResizeObserver(() => handle.resize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [handle]);

  // Show every listed dealer whenever the list changes (search, filter, near me).
  useEffect(() => {
    if (!handle) return;
    handle.fitTo(userLocation ? [userLocation, ...places.slice(0, 3)] : places);
    redraw.current();
  }, [handle, places, userLocation]);

  // Follow the selection: zoom to the dealer and open its popup.
  useEffect(() => {
    if (!handle || !popupElement) return;
    const place = places.find((entry) => entry.id === selectedId);
    if (!place) {
      pendingOpen.current = null;
      handle.closePopup();
      redraw.current();
      return;
    }
    pendingOpen.current = place.id;
    const view = handle.getView();
    if (view.zoom >= SELECTED_ZOOM - 1 && place.lng >= view.bbox[0] && place.lng <= view.bbox[2] && place.lat >= view.bbox[1] && place.lat <= view.bbox[3]) {
      redraw.current();
    } else {
      handle.flyTo(place, Math.max(view.zoom, SELECTED_ZOOM));
    }
  }, [handle, selectedId, places, popupElement]);

  const selected = dealers.find((dealer) => dealer.id === selectedId);

  return (
    // Leaflet lays tiles out left-to-right; `isolate` keeps its panes under the sticky header.
    <div dir="ltr" role="region" aria-label={label} className="relative isolate h-full w-full bg-secondary">
      <div ref={container} className="h-full w-full" />
      {failed ? (
        <p dir={dir} className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">{unavailableText}</p>
      ) : null}
      {popupElement && selected
        ? createPortal(
            <div dir={dir} className="font-sans">
              {renderPopup(selected)}
            </div>,
            popupElement,
          )
        : null}
    </div>
  );
}
