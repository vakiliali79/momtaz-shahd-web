"use client";

import { useEffect } from "react";
import { divIcon, type LeafletMouseEvent } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";

export type LatLng = { lat: number; lng: number };

export type LocationPickerProps = {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  /** Where to centre the map when there is no pin yet. */
  center: [number, number];
  zoom?: number;
  /** Accessible name of the map region. */
  label: string;
  /** HTML attribution for the map tiles (required by OpenStreetMap). */
  attribution: string;
  /** Called with the map so the parent can offer "pin at map centre". */
  onMapReady?: (getCenter: () => LatLng) => void;
};

// Brand-red pin drawn in SVG (Leaflet's default marker images do not survive
// bundling). The tip of the pin sits on the chosen point.
const pinIcon = divIcon({
  className: "",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  html: `<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 39s13-13.4 13-23A13 13 0 0 0 3 16c0 9.6 13 23 13 23z" fill="#c8102e" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>`,
});

function ClickToPlace({ onChange }: { onChange: (value: LatLng) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

/** Recentres the map when the suggested centre changes (e.g. a new province). */
function FollowCenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  return null;
}

/** Brings the pin into view when it is placed outside the visible area. */
function FollowPin({ value }: { value: LatLng | null }) {
  const map = useMap();
  const lat = value?.lat;
  const lng = value?.lng;
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    if (!map.getBounds().contains([lat, lng])) map.setView([lat, lng], 15);
  }, [map, lat, lng]);
  return null;
}

function ExposeCenter({ onMapReady }: { onMapReady?: (getCenter: () => LatLng) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(() => {
      const { lat, lng } = map.getCenter();
      return { lat, lng };
    });
  }, [map, onMapReady]);
  return null;
}

/**
 * Interactive map (Leaflet + OpenStreetMap tiles) for choosing a point.
 * Click or tap to drop the pin, drag it to adjust. Reusable by the dealer
 * locator. Load it through `MapPicker` (client-only).
 */
export default function LocationPicker({
  value,
  onChange,
  center,
  zoom = 11,
  label,
  attribution,
  onMapReady,
}: LocationPickerProps) {
  return (
    // Leaflet positions tiles assuming left-to-right layout, and its panes use
    // z-index up to 1000: `isolate` keeps them below the sticky header.
    <div dir="ltr" role="region" aria-label={label} className="isolate h-full w-full">
      <MapContainer
        center={value ? [value.lat, value.lng] : center}
        zoom={value ? 15 : zoom}
        scrollWheelZoom={false}
        className="h-full w-full rounded-xl"
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={attribution} />
        <FollowCenter lat={center[0]} lng={center[1]} zoom={zoom} />
        <FollowPin value={value} />
        <ExposeCenter onMapReady={onMapReady} />
        <ClickToPlace onChange={onChange} />
        {value ? (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            keyboard={false}
            eventHandlers={{
              dragend(event) {
                const { lat, lng } = event.target.getLatLng();
                onChange({ lat, lng });
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
