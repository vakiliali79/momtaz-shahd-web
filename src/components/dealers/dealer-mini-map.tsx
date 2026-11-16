"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { localeMeta } from "@/i18n/locales";
import type { DealerSummary } from "@/lib/data/catalog";
import { formatNumber } from "@/lib/format";

const DealerMap = dynamic(() => import("@/components/dealers/dealer-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

/** A single dealer's pin on the map (detail page). */
export function DealerMiniMap({ dealer }: { dealer: DealerSummary }) {
  const t = useTranslations("dealers");
  const locale = useLocale();
  return (
    <DealerMap
      dealers={[dealer]}
      selectedId={null}
      onSelect={() => undefined}
      userLocation={null}
      label={t("mapOf", { name: dealer.name })}
      attribution={`© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">${t("osm")}</a>`}
      dir={localeMeta[locale].dir}
      unavailableText={t("mapUnavailable")}
          clusterLabel={(count) => t("cluster", { count, formatted: formatNumber(count, locale) })}
          userLabel={t("youAreHere")}
      renderPopup={() => null}
    />
  );
}
