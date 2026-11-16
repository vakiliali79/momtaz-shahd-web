import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-brand-gold/15 text-brand-gold",
  PAID: "bg-brand-leaf/15 text-brand-leaf dark:text-success",
  PROCESSING: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  SHIPPED: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  DELIVERED: "bg-brand-leaf/20 text-brand-leaf dark:text-success",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const t = useTranslations("order.status");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        statusStyles[status],
        className,
      )}
    >
      {t(status)}
    </span>
  );
}

export function AccountHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-fluid-2xl font-bold">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AccountEmpty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-input px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-secondary text-brand-gold">{icon}</span>
      <h2 className="text-fluid-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
  );
}
