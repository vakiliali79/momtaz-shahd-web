"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toLatinDigits } from "@/lib/validation/phone";

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = "md",
  className,
}: {
  value: number;
  /** Highest allowed quantity (the stock). */
  max: number;
  onChange: (quantity: number) => void;
  /** Accessible name, e.g. "Quantity of Walnut koloocheh". */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = useTranslations("product");
  const locale = useLocale();
  const upper = Math.max(1, max);
  const clamp = (quantity: number) => Math.min(upper, Math.max(1, Math.round(quantity) || 1));

  const buttonClass = cn(
    "grid place-items-center rounded-full text-foreground transition hover:bg-muted active:scale-90 disabled:pointer-events-none disabled:opacity-35",
    size === "sm" ? "size-8" : "size-11",
  );

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-full border border-input bg-background p-0.5",
        className,
      )}
    >
      <button
        type="button"
        aria-label={t("decrease")}
        disabled={value <= 1}
        onClick={() => onChange(clamp(value - 1))}
        className={buttonClass}
      >
        <MinusIcon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={t("quantity")}
        value={formatNumber(value, locale)}
        onChange={(event) => {
          const digits = toLatinDigits(event.target.value).replace(/\D/g, "");
          onChange(clamp(Number(digits)));
        }}
        onFocus={(event) => event.currentTarget.select()}
        className={cn(
          "bg-transparent text-center font-semibold tabular-nums outline-none",
          size === "sm" ? "w-8 text-sm" : "w-12 text-base",
        )}
      />
      <button
        type="button"
        aria-label={t("increase")}
        disabled={value >= upper}
        onClick={() => onChange(clamp(value + 1))}
        className={buttonClass}
      >
        <PlusIcon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden="true" />
      </button>
    </div>
  );
}
