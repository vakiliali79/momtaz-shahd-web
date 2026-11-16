import { useLocale, useTranslations } from "next-intl";

import { placeName, type AddressSnapshot } from "@/lib/orders/types";
import type { OrderView } from "@/lib/orders/queries";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";

function AddressBlock({ address }: { address: AddressSnapshot }) {
  const t = useTranslations("address");
  const locale = useLocale();
  return (
    <address className="space-y-1 text-sm not-italic">
      <p className="font-medium">{address.title}</p>
      <p className="text-muted-foreground">
        {t("place", {
          province: placeName(address.province.name, locale),
          city: placeName(address.city.name, locale),
        })}{" "}
        — {address.fullAddress}
      </p>
      <p className="text-muted-foreground">
        {t("postalCodeLine")} <span dir="ltr">{address.postalCode}</span>
      </p>
      <p className="text-muted-foreground">
        {t("receiverLine", { name: address.receiverName })} <span dir="ltr">{address.receiverPhone}</span>
      </p>
    </address>
  );
}

/** Items, totals, delivery and payment of a placed order. */
export function OrderDetails({ order }: { order: OrderView }) {
  const t = useTranslations();
  const locale = useLocale();
  const price = (amount: number) => formatPrice(amount, locale, t("common.toman"));

  return (
    <div className="space-y-6">
      <dl className="grid gap-3 rounded-2xl bg-muted/60 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.number")}</dt>
          <dd className="font-semibold" dir="ltr">{order.orderNumber}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.date")}</dt>
          <dd className="font-semibold">
            <time dateTime={order.createdAt}>
              {formatDate(order.createdAt, locale, { dateStyle: "long", timeStyle: "short" })}
            </time>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("order.statusLabel")}</dt>
          <dd className="font-semibold">{t(`order.status.${order.status}`)}</dd>
        </div>
      </dl>

      <section aria-labelledby="order-items">
        <h2 id="order-items" className="mb-3 font-semibold">{t("order.items")}</h2>
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <span className="min-w-0">
                <span dir="auto" className="block font-medium">{item.productName}</span>
                <span className="text-xs text-muted-foreground">
                  {t("order.quantityTimes", {
                    quantity: formatNumber(item.quantity, locale),
                    price: price(item.unitPrice),
                  })}
                </span>
              </span>
              <span className="shrink-0 font-semibold">{price(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt>{t("cart.subtotal")}</dt>
            <dd>{price(order.subtotal)}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between gap-3 text-brand-leaf dark:text-success">
              <dt>{order.couponCode ? t("cart.discount", { code: order.couponCode }) : t("order.discount")}</dt>
              <dd>−{price(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt>{t("order.shipping")}</dt>
            <dd>{order.shippingCost === 0 ? t("cart.shippingFree") : price(order.shippingCost)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-3 text-base font-bold">
            <dt>{t("cart.total")}</dt>
            <dd className="text-primary">{price(order.total)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="order-delivery" className="rounded-2xl border border-border p-4">
          <h2 id="order-delivery" className="mb-2 font-semibold">{t("order.delivery")}</h2>
          {order.shippingMethod ? (
            <p className="mb-2 text-sm">{t(`checkout.shipping.methods.${order.shippingMethod}.name`)}</p>
          ) : null}
          {order.address ? <AddressBlock address={order.address} /> : null}
        </section>
        <section aria-labelledby="order-payment" className="rounded-2xl border border-border p-4">
          <h2 id="order-payment" className="mb-2 font-semibold">{t("order.payment")}</h2>
          <p className="text-sm">{t(`checkout.payment.methods.${order.paymentMethod}.name`)}</p>
          {order.paymentRef ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("order.paymentRef")} <span dir="ltr">{order.paymentRef}</span>
            </p>
          ) : null}
          {order.note ? (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t("checkout.note.label")}: </span>
              <span dir="auto">{order.note}</span>
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
