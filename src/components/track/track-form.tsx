"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageSearchIcon, TruckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { trackOrder, type TrackedOrder } from "@/actions/track";
import { OrderStatusBadge } from "@/components/account/account-ui";
import { OrderTimeline } from "@/components/account/order-timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { toTrackErrorKey, trackSchema, type TrackInput } from "@/lib/validation/track";

function TrackedOrderCard({ order }: { order: TrackedOrder }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <section aria-labelledby="tracked-order" className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="tracked-order" className="text-lg font-bold">
            {t("track.orderTitle")} <span dir="ltr">{order.orderNumber}</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.createdAt, locale, { dateStyle: "long" })}
            {order.city ? ` · ${order.city[locale] || order.city.fa}` : null}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.trackingCode ? (
        <div className="flex items-start gap-3 rounded-2xl bg-secondary/70 p-4">
          <TruckIcon className="mt-0.5 size-5 shrink-0 text-brand-gold" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">{t("track.trackingCode")}</p>
            <p className="font-mono text-lg font-semibold" dir="ltr">{order.trackingCode}</p>
            {order.shippingMethod ? (
              <p className="text-xs text-muted-foreground">{t("track.carrier", { carrier: t(`checkout.shipping.methods.${order.shippingMethod}.name`) })}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">{t("track.progress")}</h3>
          <OrderTimeline history={order.history} />
        </div>
        <div>
          <h3 className="mb-3 font-semibold">{t("track.items")}</h3>
          <ul className="divide-y divide-border text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-2">
                <span>{item.productName}</span>
                <span className="shrink-0 text-muted-foreground">× {formatNumber(item.quantity, locale)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("track.payment")}</dt>
              <dd>{t(`checkout.payment.methods.${order.paymentMethod}.name`)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-semibold">
              <dt>{t("cart.total")}</dt>
              <dd>{formatPrice(order.total, locale, t("common.toman"))}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("track.accountHint")}{" "}
        <Link href={`/account/orders/${order.orderNumber}`} className="font-medium text-primary hover:underline">{t("track.accountLink")}</Link>
      </p>
    </section>
  );
}

export function TrackForm() {
  const t = useTranslations("track");
  const id = useId();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TrackInput>({ resolver: zodResolver(trackSchema), defaultValues: { orderNumber: "", phone: "" } });

  async function onSubmit(values: TrackInput) {
    setFormError(null);
    const result = await trackOrder(values).catch(() => ({ ok: false as const, error: "server" as const, field: undefined }));
    if (result.ok) {
      setOrder(result.order);
      return;
    }
    setOrder(null);
    if (result.field && (result.error === "invalidNumber" || result.error === "invalidPhone")) setError(result.field, { message: result.error });
    else setFormError(t(`errors.${result.error}`));
  }

  const fieldError = (name: "orderNumber" | "phone") => {
    const message = errors[name]?.message;
    return message ? (
      <p id={`${id}-${name}-error`} role="alert" className="text-sm text-destructive">{t(`errors.${toTrackErrorKey(message)}`)}</p>
    ) : null;
  };
  const aria = (name: "orderNumber" | "phone") => ({
    id: `${id}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : `${id}-${name}-hint`,
  });

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 rounded-3xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2 sm:p-8">
        <div className="space-y-2">
          <Label htmlFor={`${id}-orderNumber`}>{t("orderNumber")}</Label>
          <Input dir="ltr" autoComplete="off" placeholder="MS-20261116-0001" className="h-11 rounded-xl px-3.5 text-start placeholder:text-start" {...aria("orderNumber")} {...register("orderNumber")} />
          <p id={`${id}-orderNumber-hint`} className="text-xs text-muted-foreground">{t("orderNumberHint")}</p>
          {fieldError("orderNumber")}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-phone`}>{t("phone")}</Label>
          <Input type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="09xxxxxxxxx" className="h-11 rounded-xl px-3.5 text-start placeholder:text-start" {...aria("phone")} {...register("phone")} />
          <p id={`${id}-phone-hint`} className="text-xs text-muted-foreground">{t("phoneHint")}</p>
          {fieldError("phone")}
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 w-full rounded-full px-8 text-base sm:w-auto">
            <PackageSearchIcon aria-hidden="true" />
            {isSubmitting ? t("searching") : t("submit")}
          </Button>
        </div>
        {formError ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{formError}</p> : null}
      </form>
      <div aria-live="polite">{order ? <TrackedOrderCard order={order} /> : null}</div>
    </div>
  );
}
