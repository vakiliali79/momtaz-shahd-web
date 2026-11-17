"use client";

import { useState, type PointerEvent } from "react";
import { ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ProductImage } from "@/components/product/product-image";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Gallery({
  images,
  name,
  dimmed = false,
}: {
  images: readonly string[];
  name: string;
  /** Greys the photo out for out-of-stock products. */
  dimmed?: boolean;
}) {
  const t = useTranslations("product.gallery");
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const current = images[index] ?? images[0] ?? "";

  function trackPointer(event: PointerEvent<HTMLButtonElement>) {
    if (!zoomed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  }

  function select(next: number) {
    setIndex(next);
    setZoomed(false);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-pressed={zoomed}
        aria-label={t(zoomed ? "zoomOut" : "zoomIn")}
        onClick={(event) => {
          setZoomed((value) => !value);
          const rect = event.currentTarget.getBoundingClientRect();
          // Keyboard activation has no pointer position: zoom on the centre.
          if (event.detail > 0) {
            setOrigin(
              `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}% ${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`,
            );
          } else {
            setOrigin("50% 50%");
          }
        }}
        onPointerMove={trackPointer}
        onPointerLeave={() => setZoomed(false)}
        className={cn(
          "relative block aspect-square w-full touch-pan-y overflow-hidden rounded-3xl bg-secondary shadow-soft",
          zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
        )}
      >
        <span
          className="absolute inset-0 transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            transform: zoomed ? "scale(2.2)" : "scale(1)",
            transformOrigin: origin,
          }}
        >
          <ProductImage
            key={current}
            src={current}
            alt={t("imageAlt", {
              name,
              index: formatNumber(index + 1, locale),
              total: formatNumber(images.length, locale),
            })}
            sizes="(min-width: 1440px) 620px, (min-width: 1024px) 45vw, 92vw"
            priority
            className={cn(dimmed && "opacity-60 grayscale")}
          />
        </span>
        <span className="pointer-events-none absolute end-3 bottom-3 grid size-9 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-soft">
          {zoomed ? (
            <ZoomOutIcon className="size-4" aria-hidden="true" />
          ) : (
            <ZoomInIcon className="size-4" aria-hidden="true" />
          )}
        </span>
      </button>

      {images.length > 1 ? (
        <ul aria-label={t("thumbnails")} className="flex gap-2 relative overflow-x-auto p-1">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                aria-label={t("showImage", { index: formatNumber(i + 1, locale) })}
                aria-current={i === index ? "true" : undefined}
                onClick={() => select(i)}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-xl bg-secondary ring-2 ring-transparent transition sm:size-20",
                  i === index ? "ring-primary" : "opacity-70 hover:opacity-100",
                )}
              >
                <ProductImage src={src} alt="" sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
