import { useLocale, useTranslations } from "next-intl";

import type { OrderView } from "@/lib/orders/queries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** History notes the customer may see, keyed by the code before any ":" detail. */
const visibleNotes = [
  "order_placed",
  "order_placed_cod",
  "payment_received",
  "payment_failed",
  "payment_needs_review",
  "receipt_uploaded",
  "receipt_rejected",
  "bank_transfer_confirmed",
  "cancelled_by_customer",
] as const;
type VisibleNote = (typeof visibleNotes)[number];

export function noteKey(note: string | null): VisibleNote | null {
  const code = note?.split(":")[0];
  return visibleNotes.find((key) => key === code) ?? null;
}

export function OrderTimeline({ history }: { history: OrderView["history"] }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <ol className="space-y-0">
      {history.map((entry, index) => {
        const key = noteKey(entry.note);
        const last = index === history.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!last ? (
              <span aria-hidden="true" className="absolute start-[0.6875rem] top-6 bottom-0 w-0.5 bg-border" />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative mt-1 size-6 shrink-0 rounded-full border-4 border-background",
                last ? "bg-primary" : "bg-brand-leaf",
              )}
            />
            <div className="min-w-0">
              <p className="font-medium">{t(`order.status.${entry.status}`)}</p>
              {key ? <p className="text-sm text-muted-foreground">{t(`accountPages.timeline.${key}`)}</p> : null}
              <p className="text-xs text-muted-foreground">
                <time dateTime={entry.createdAt}>
                  {formatDate(entry.createdAt, locale, { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
