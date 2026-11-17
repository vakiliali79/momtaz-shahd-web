/**
 * A small map interface the dealer locator draws on, so the map engine can
 * be swapped: Neshan (Iranian maps, needs NEXT_PUBLIC_NESHAN_KEY) or
 * Leaflet with OpenStreetMap tiles. Both run in the browser only.
 */

export type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: "place" | "cluster" | "user";
  /** Accessible name (and tooltip) of the marker. */
  label: string;
  /** Number of places inside a cluster marker. */
  count?: number;
  /** Shown in brand gold instead of red. */
  highlighted?: boolean;
  selected?: boolean;
};

export type MapView = { bbox: [west: number, south: number, east: number, north: number]; zoom: number };

export type MapEvents = {
  onViewChange: () => void;
  onMarkerClick: (marker: MapMarker) => void;
  onPopupClose: () => void;
};

export type MapOptions = {
  center: [number, number];
  zoom: number;
  /** Accessible name of the map region. */
  label: string;
  /** Attribution HTML for OpenStreetMap tiles. */
  attribution: string;
};

export interface MapHandle {
  readonly provider: "neshan" | "leaflet";
  setMarkers(markers: MapMarker[]): void;
  flyTo(point: LatLng, zoom?: number): void;
  fitTo(points: LatLng[]): void;
  getView(): MapView;
  /** Opens a popup on a place marker with the given (React-managed) element. */
  openPopup(markerId: string, content: HTMLElement): boolean;
  closePopup(): void;
  /** Call after the container changes size. */
  resize(): void;
  destroy(): void;
}

export interface MapProvider {
  readonly id: "neshan" | "leaflet";
  create(container: HTMLElement, options: MapOptions, events: MapEvents): Promise<MapHandle>;
}
