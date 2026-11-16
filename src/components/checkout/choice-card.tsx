"use client";

import type { ReactNode } from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** A radio button styled as a selectable card. */
export function ChoiceCard({
  name,
  value,
  checked,
  disabled = false,
  onSelect,
  children,
  aside,
  describedBy,
}: {
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: (value: string) => void;
  children: ReactNode;
  /** Right-hand (inline-end) content, e.g. a price. */
  aside?: ReactNode;
  describedBy?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer gap-3 rounded-2xl border bg-card p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
        checked ? "border-primary ring-1 ring-primary" : "border-border hover:border-brand-gold/60",
        disabled && "cursor-not-allowed opacity-55 hover:border-border",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        aria-describedby={describedBy}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {checked ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1 text-sm">{children}</span>
      {aside ? <span className="shrink-0 text-end text-sm font-semibold">{aside}</span> : null}
    </label>
  );
}
