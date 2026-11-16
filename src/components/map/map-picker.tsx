"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { CrosshairIcon, LocateFixedIcon, MapPinOffIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { LatLng } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { localeMeta } from "@/i18n/locales";

// Leaflet needs `window`, so the map only renders in the browser.
const LocationPicker = dynamic(() => import("@/components/map/location-picker"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

/** Optional map pin with keyboard-friendly alternatives to clicking the map. */
export function MapPicker({
  value,
  onChange,
  center,
}: {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
  center: [number, number];
}) {
  const t = useTranslations("map");
  const locale = useLocale();
  const getCenter = useRef<(() => LatLng) | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const onMapReady = useCallback((fn: () => LatLng) => {
    getCenter.current = fn;
  }, []);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError(true);
      return;
    }
    setLocating(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setLocating(false);
        setGeoError(true);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const coords = value
    ? new Intl.NumberFormat(localeMeta[locale].numberLocale, { maximumFractionDigits: 5 })
    : null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      <div className="aspect-4/3 w-full overflow-hidden rounded-xl border border-border sm:aspect-video">
        <LocationPicker
          value={value}
          onChange={onChange}
          center={center}
          label={t("label")}
          attribution={`© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">${t("osm")}</a>`}
          onMapReady={onMapReady}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={useMyLocation} disabled={locating}>
          <LocateFixedIcon aria-hidden="true" />
          {locating ? t("locating") : t("useMyLocation")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => {
            const centerPoint = getCenter.current?.();
            if (centerPoint) onChange(centerPoint);
          }}
        >
          <CrosshairIcon aria-hidden="true" />
          {t("pinAtCenter")}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => onChange(null)}>
            <MapPinOffIcon aria-hidden="true" />
            {t("removePin")}
          </Button>
        ) : null}
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {geoError
          ? t("locationError")
          : value && coords
            ? t("pinned", { lat: coords.format(value.lat), lng: coords.format(value.lng) })
            : t("noPin")}
      </p>
    </div>
  );
}
