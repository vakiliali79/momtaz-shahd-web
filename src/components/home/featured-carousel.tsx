"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

/**
 * Horizontal product row on native CSS scroll snapping: swipe, trackpad and
 * arrow keys work without a carousel library, in the reading direction.
 * The buttons scroll one view at a time. Slides are server-rendered.
 */
export function FeaturedCarousel({ label, children }: { label: string; children: ReactNode }) {
  const t = useTranslations("carousel");
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    // scrollLeft is negative in right-to-left layouts; its size is what matters.
    const offset = Math.abs(element.scrollLeft);
    const max = element.scrollWidth - element.clientWidth;
    setEdges({ start: offset < 4, end: offset > max - 4 });
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  function go(direction: 1 | -1) {
    const element = scroller.current;
    if (!element) return;
    const rtl = getComputedStyle(element).direction === "rtl";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({ left: direction * (rtl ? -1 : 1) * element.clientWidth * 0.9, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <section aria-roledescription={t("roleDescription")} aria-label={label} className="w-full">
      <ul
        ref={scroller}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 py-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <li className="w-[78%] shrink-0 snap-start min-[420px]:w-[calc(50%-0.5rem)] md:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)] 2xl:w-[calc((100%-5rem)/5)]">
            {child}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-center gap-2">
        <Button variant="outline" size="icon-lg" className="rounded-full" onClick={() => go(-1)} disabled={edges.start} aria-label={t("previous")}>
          <ChevronLeftIcon className="rtl:rotate-180" aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon-lg" className="rounded-full" onClick={() => go(1)} disabled={edges.end} aria-label={t("next")}>
          <ChevronRightIcon className="rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
