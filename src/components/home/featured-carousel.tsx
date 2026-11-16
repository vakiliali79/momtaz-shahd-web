"use client";

import { Children, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getDirection } from "@/i18n/locales";

/** Embla carousel; each child (a server-rendered product card) is one slide. */
export function FeaturedCarousel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const t = useTranslations("carousel");
  const locale = useLocale();

  return (
    <Carousel
      aria-label={label}
      opts={{ align: "start", direction: getDirection(locale), containScroll: "trimSnaps" }}
      className="w-full"
    >
      <CarouselContent className="-ms-4 py-2 sm:-ms-5">
        {Children.map(children, (child) => (
          <CarouselItem className="basis-[78%] ps-4 min-[420px]:basis-1/2 sm:ps-5 md:basis-1/3 xl:basis-1/4 2xl:basis-1/5">
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-5 flex justify-center gap-2">
        <CarouselPrevious
          label={t("previous")}
          size="icon-lg"
          className="static translate-0 rounded-full"
        />
        <CarouselNext
          label={t("next")}
          size="icon-lg"
          className="static translate-0 rounded-full"
        />
      </div>
    </Carousel>
  );
}
