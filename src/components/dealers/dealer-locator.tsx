"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { BadgeCheckIcon, LocateFixedIcon, SearchIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { DealerDetails } from "@/components/dealers/dealer-details";
import type { LatLng } from "@/components/map/providers/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { localeMeta } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import type { DealerSummary } from "@/lib/data/catalog";
import { dealerTypes, distanceKm, type DealerType } from "@/lib/dealers";
import { formatNumber } from "@/lib/format";
import { normalizeSearchText } from "@/lib/search-text";
import { cn } from "@/lib/utils";

// Map engines need `window`: the map only renders in the browser.
const DealerMap = dynamic(() => import("@/components/dealers/dealer-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

type Located = DealerSummary & { distance: number | null };

export function DealerLocator({ dealers, title, lead }: { dealers: DealerSummary[]; title: string; lead: string }) {
  const t = useTranslations("dealers");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<DealerType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const mapBox = useRef<HTMLDivElement>(null);

  function select(id: string | null) {
    setSelectedId(id);
    // On phones the map sits above the list: bring it into view.
    if (id && window.matchMedia("(max-width: 1023px)").matches) mapBox.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const visible = useMemo<Located[]>(() => {
    const needle = normalizeSearchText(query);
    const list = dealers
      .filter((dealer) => !type || dealer.type === type)
      .filter((dealer) => !needle || normalizeSearchText(`${dealer.city} ${dealer.province} ${dealer.name} ${dealer.address}`).includes(needle))
      .map((dealer) => ({
        ...dealer,
        distance: userLocation && dealer.lat !== null && dealer.lng !== null ? distanceKm(userLocation, { lat: dealer.lat, lng: dealer.lng }) : null,
      }));
    return userLocation ? list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)) : list;
  }, [dealers, query, type, userLocation]);

  function nearMe() {
    if (!("geolocation" in navigator)) {
      setGeoError(t("geoUnsupported"));
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setSelectedId(null);
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        setLocating(false);
        setGeoError(error.code === error.PERMISSION_DENIED ? t("geoDenied") : t("geoFailed"));
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const km = (distance: number) =>
    t("distance", { value: new Intl.NumberFormat(localeMeta[locale].numberLocale, { maximumFractionDigits: distance < 10 ? 1 : 0 }).format(distance) });

  return (
    <div className="grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(22rem,26rem)_1fr]">
      {/* Map first on phones (top), beside the list on large screens (end side). */}
      <div ref={mapBox} className="h-[55dvh] min-h-80 scroll-mt-16 border-b border-border lg:order-2 lg:h-full lg:border-b-0">
        <DealerMap
          dealers={visible}
          selectedId={selectedId}
          onSelect={setSelectedId}
          userLocation={userLocation}
          label={t("mapLabel")}
          attribution={`© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">${t("osm")}</a>`}
          dir={localeMeta[locale].dir}
          unavailableText={t("mapUnavailable")}
          clusterLabel={(count) => t("cluster", { count, formatted: formatNumber(count, locale) })}
          userLabel={t("youAreHere")}
          renderPopup={(dealer) => (
            <div className="space-y-2 text-foreground">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                {dealer.name}
                {dealer.isVerified ? <BadgeCheckIcon className="size-4 text-brand-leaf" aria-label={t("verified")} /> : null}
              </p>
              <p className="text-xs text-muted-foreground">{t(`types.${dealer.type}`)} · {dealer.city}</p>
              <DealerDetails dealer={dealer} compact />
              <Link href={`/dealers/${dealer.id}`} className="inline-block text-xs font-semibold text-primary hover:underline">{t("moreInfo")}</Link>
            </div>
          )}
        />
      </div>

      <section aria-labelledby="dealer-list-title" className="flex min-h-0 flex-col border-border lg:order-1 lg:border-e">
        <div className="space-y-3 border-b border-border p-4">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{lead}</p>
          </div>
          <h2 id="dealer-list-title" className="sr-only">{t("listTitle")}</h2>
          <form role="search" className="relative" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="dealer-search" className="sr-only">{t("search")}</label>
            <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="dealer-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search")}
              className="h-11 rounded-xl ps-9"
            />
          </form>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterLabel")}>
            {[null, ...dealerTypes].map((value) => (
              <button
                key={value ?? "all"}
                type="button"
                aria-pressed={type === value}
                onClick={() => setType(value)}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  type === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-brand-gold",
                )}
              >
                {value ? t(`types.${value}`) : t("allTypes")}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={nearMe} disabled={locating}>
              <LocateFixedIcon aria-hidden="true" />
              {locating ? t("locating") : t("nearMe")}
            </Button>
            {userLocation ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setUserLocation(null)}>
                <XIcon aria-hidden="true" />
                {t("clearLocation")}
              </Button>
            ) : null}
          </div>
          {geoError ? <p role="alert" className="text-xs text-destructive">{geoError}</p> : null}
          <p role="status" className="text-xs text-muted-foreground">
            {t("count", { count: visible.length, formatted: formatNumber(visible.length, locale) })}
            {userLocation ? ` · ${t("sortedByDistance")}` : null}
          </p>
        </div>

        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {visible.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("empty")}</li>
          ) : (
            visible.map((dealer) => {
              const selected = dealer.id === selectedId;
              const onMap = dealer.lat !== null && dealer.lng !== null;
              return (
                <li key={dealer.id}>
                  {/* Clicking the card shows it on the map (the "Show on map" button is the keyboard equivalent); links and buttons inside keep their own action. */}
                  <article
                    onClick={(event) => {
                      if (onMap && !(event.target instanceof Element && event.target.closest("a, button"))) select(dealer.id);
                    }}
                    className={cn(
                      onMap && "cursor-pointer",
                      "@container rounded-2xl border bg-card p-4 shadow-soft transition-colors hover:border-brand-gold/60",
                      selected ? "border-primary ring-2 ring-primary/20" : "border-border",
                    )}
                  >
                    <div className="flex flex-col gap-2 @[19rem]:flex-row @[19rem]:items-start @[19rem]:justify-between @[19rem]:gap-3">
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-1.5 font-semibold">
                          <Link href={`/dealers/${dealer.id}`} className="hover:text-primary">{dealer.name}</Link>
                          {dealer.isVerified ? <BadgeCheckIcon className="size-4 shrink-0 text-brand-leaf" aria-label={t("verified")} /> : null}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t(`types.${dealer.type}`)} · {dealer.city}
                          {dealer.distance !== null ? ` · ${km(dealer.distance)}` : null}
                        </p>
                      </div>
                      {onMap ? (
                        <Button
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          className="min-h-11 shrink-0 self-start rounded-full"
                          aria-pressed={selected}
                          onClick={() => select(selected ? null : dealer.id)}
                        >
                          {t("showOnMap")}
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <DealerDetails dealer={dealer} compact />
                    </div>
                  </article>
                </li>
              );
            })
          )}
        </ul>
        <div className="border-t border-border p-4 text-center text-sm">
          {t("applyPrompt")}{" "}
          <Link href="/dealers/apply" className="font-semibold text-primary hover:underline">{t("applyLink")}</Link>
        </div>
      </section>
    </div>
  );
}
