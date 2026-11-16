import { AtSignIcon, ClockIcon, MapPinIcon, MessageCircleIcon, NavigationIcon, PhoneIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { DealerSummary } from "@/lib/data/catalog";
import { directionsLinks, instagramHref, telHref, whatsappHref } from "@/lib/dealers";
import { cn } from "@/lib/utils";

/** Address, contact links, hours and directions of a dealer (popup, card and detail page). */
export function DealerDetails({ dealer, compact = false }: { dealer: DealerSummary; compact?: boolean }) {
  const t = useTranslations("dealers");
  const links = dealer.lat !== null && dealer.lng !== null ? directionsLinks({ lat: dealer.lat, lng: dealer.lng }) : null;
  const row = cn("flex gap-2", compact ? "text-xs" : "text-sm");
  const icon = "mt-0.5 size-4 shrink-0 text-brand-gold";

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <p className={row}>
        <MapPinIcon className={icon} aria-hidden="true" />
        <span>
          <span className="sr-only">{t("address")}: </span>
          {dealer.address}
        </span>
      </p>
      {dealer.phone ? (
        <p className={row}>
          <PhoneIcon className={icon} aria-hidden="true" />
          <a href={telHref(dealer.phone)} dir="ltr" className="font-medium hover:text-primary" aria-label={t("call", { phone: dealer.phone })}>
            {dealer.phone}
          </a>
        </p>
      ) : null}
      {dealer.openingHours ? (
        <p className={row}>
          <ClockIcon className={icon} aria-hidden="true" />
          <span>
            <span className="sr-only">{t("hours")}: </span>
            {dealer.openingHours}
          </span>
        </p>
      ) : null}
      {dealer.whatsapp || dealer.instagram ? (
        <p className={cn(row, "flex-wrap gap-x-4")}>
          {dealer.whatsapp ? (
            <a href={whatsappHref(dealer.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-primary">
              <MessageCircleIcon className="size-4 text-brand-leaf" aria-hidden="true" />
              {t("whatsapp")}
            </a>
          ) : null}
          {dealer.instagram ? (
            <a href={instagramHref(dealer.instagram)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-primary">
              <AtSignIcon className="size-4 text-primary" aria-hidden="true" />
              <span dir="ltr">@{dealer.instagram}</span>
            </a>
          ) : null}
        </p>
      ) : null}
      {links ? (
        <div className={cn(row, "flex-wrap items-center gap-x-3 gap-y-1 pt-1")}>
          <NavigationIcon className={icon} aria-hidden="true" />
          <span className="font-medium">{t("directions")}:</span>
          <a href={links.google} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t("apps.google")}</a>
          <a href={links.neshan} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t("apps.neshan")}</a>
          <a href={links.balad} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t("apps.balad")}</a>
        </div>
      ) : null}
    </div>
  );
}
