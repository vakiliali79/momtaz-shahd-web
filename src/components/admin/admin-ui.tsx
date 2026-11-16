import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AdminHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-fluid-xl font-bold">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({
  title,
  children,
  className,
  actions,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title ? <h2 className="font-semibold">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

export function Pill({ tone = "muted", children }: { tone?: "muted" | "green" | "gold" | "red" | "blue"; children: ReactNode }) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    green: "bg-brand-leaf/15 text-leaf-ink",
    gold: "bg-brand-gold/15 text-gold-ink",
    red: "bg-destructive/10 text-destructive",
    blue: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone])}>
      {children}
    </span>
  );
}
