"use client";

import { useState, useTransition } from "react";
import {
  BanknoteIcon,
  CheckIcon,
  CreditCardIcon,
  HandCoinsIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { placeOrder, type PlaceOrderResult } from "@/actions/checkout";
import { useCartRefresher, useCartSync } from "@/components/cart/use-cart";
import { AddressForm } from "@/components/checkout/address-form";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { ChoiceCard } from "@/components/checkout/choice-card";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { computeCartTotals } from "@/lib/cart";
import { formatNumber, formatPrice } from "@/lib/format";
import { getCity, getProvince } from "@/lib/locations";
import type { AddressDto } from "@/lib/orders/types";
import {
  applyFreeShipping,
  calculateShipping,
  shippingAvailability,
  type ShippingConfig,
  type ShippingMethodId,
} from "@/lib/shipping";
import { cn } from "@/lib/utils";
import { ORDER_NOTE_MAX, type PaymentMethodId } from "@/lib/validation/checkout";
import { useCartHydrated, useCartStore } from "@/stores/cart";

type Step = 1 | 2 | 3;

export type CheckoutUser = {
  name: string;
  phone: string;
  isWholesale: boolean;
};

function StepIndicator({
  step,
  maxReached,
  onSelect,
}: {
  step: Step;
  maxReached: Step;
  onSelect: (step: Step) => void;
}) {
  const t = useTranslations("checkout.steps");
  const locale = useLocale();
  const steps = [
    { id: 1, label: t("address") },
    { id: 2, label: t("shipping") },
    { id: 3, label: t("payment") },
  ] as const;

  return (
    <nav aria-label={t("label")} className="mb-6">
      <ol className="flex items-center gap-2">
        {steps.map(({ id, label }, index) => {
          const done = id < step;
          const current = id === step;
          const reachable = id <= maxReached && !current;
          const content = (
            <>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
                  current && "bg-primary text-primary-foreground",
                  done && "bg-brand-leaf text-white",
                  !current && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <CheckIcon className="size-4" aria-hidden="true" /> : formatNumber(id, locale)}
              </span>
              <span className={cn("text-sm font-medium max-sm:sr-only", !current && "text-muted-foreground")}>
                {label}
              </span>
            </>
          );
          return (
            <li key={id} className="flex flex-1 items-center gap-2" aria-current={current ? "step" : undefined}>
              {reachable ? (
                <button type="button" onClick={() => onSelect(id)} className="flex items-center gap-2 rounded-full">
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2">{content}</span>
              )}
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className={cn("h-0.5 flex-1 rounded-full", done ? "bg-brand-leaf" : "bg-border")} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AddressSummary({ address }: { address: AddressDto }) {
  const t = useTranslations("address");
  const locale = useLocale();
  const province = getProvince(address.province);
  const city = getCity(address.province, address.city);

  return (
    <span className="block space-y-1">
      <span className="block font-semibold">{address.title}</span>
      <span className="block text-muted-foreground">
        {t("place", { province: province?.name[locale] ?? "", city: city?.name[locale] ?? "" })} —{" "}
        {address.fullAddress}
      </span>
      <span className="block text-xs text-muted-foreground">
        {t("receiverLine", { name: address.receiverName })}{" "}
        <span dir="ltr">{address.receiverPhone}</span>
        <span aria-hidden="true"> · </span>
        {t("postalCodeLine")} <span dir="ltr">{address.postalCode}</span>
        {address.lat !== null ? (
          <>
            <span aria-hidden="true"> · </span>
            <MapPinIcon className="inline size-3" aria-hidden="true" /> {t("pinSaved")}
          </>
        ) : null}
      </span>
    </span>
  );
}

const paymentIcons = {
  ONLINE: CreditCardIcon,
  COD: HandCoinsIcon,
  BANK_TRANSFER: BanknoteIcon,
} as const satisfies Record<PaymentMethodId, unknown>;

export function CheckoutFlow({
  user,
  initialAddresses,
  shipping,
  onlinePayment,
}: {
  user: CheckoutUser;
  initialAddresses: AddressDto[];
  shipping: ShippingConfig;
  onlinePayment: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const coupon = useCartStore((state) => state.coupon);
  const clearCart = useCartStore((state) => state.clearCart);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const refreshCart = useCartRefresher();
  useCartSync(true);

  const [step, setStep] = useState<Step>(1);
  const [maxReached, setMaxReached] = useState<Step>(1);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState<string | null>(
    (initialAddresses.find((address) => address.isDefault) ?? initialAddresses[0])?.id ?? null,
  );
  const [addingAddress, setAddingAddress] = useState(initialAddresses.length === 0);
  const [method, setMethod] = useState<ShippingMethodId | null>(null);
  const [payment, setPayment] = useState<PaymentMethodId | null>(onlinePayment ? "ONLINE" : "COD");
  const [note, setNote] = useState("");
  const [placing, startPlacing] = useTransition();
  const [placed, setPlaced] = useState(false);

  const address = addresses.find((entry) => entry.id === addressId) ?? null;
  const destination = address ? { province: address.province, city: address.city } : null;
  const methodAvailable =
    method !== null && shippingAvailability(shipping, method, destination).available;
  const chosenMethod = methodAvailable ? method : null;
  const totals = computeCartTotals(items, coupon, {
    config: shipping,
    method: step >= 2 ? chosenMethod : null,
    destination,
  });
  const afterDiscount = totals.subtotal - totals.discount;
  const isWholesale = user.isWholesale || totals.wholesaleSavings > 0;
  const price = (amount: number) => formatPrice(amount, locale, t("common.toman"));

  function goTo(next: Step) {
    setStep(next);
    setMaxReached((current) => (next > current ? next : current));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!hydrated) {
    return (
      <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_24rem]" aria-busy="true">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="hidden h-96 rounded-2xl lg:block" />
      </Container>
    );
  }

  if (items.length === 0 && !placed) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-md place-items-center gap-3 rounded-3xl border border-dashed border-input px-6 py-14 text-center">
          <ShoppingBagIcon className="size-10 text-brand-gold" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-fluid-lg font-bold">{t("cart.empty.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("checkout.emptyText")}</p>
          <Button asChild size="lg" className="mt-2 h-11 rounded-full px-6">
            <Link href="/products">{t("cart.empty.cta")}</Link>
          </Button>
        </div>
      </Container>
    );
  }

  function handleError(result: Extract<PlaceOrderResult, { ok: false }>) {
    const message = t(`checkout.errors.${result.error}`, {
      name: result.detail ?? "",
      formatted: formatNumber(result.available ?? 0, locale),
    });
    switch (result.error) {
      case "unauthorized":
        router.push(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/checkout`)}`);
        return;
      case "outOfStock":
      case "productUnavailable":
      case "totalChanged":
        void refreshCart();
        break;
      case "couponInvalid":
        removeCoupon();
        break;
      case "addressRequired":
        goTo(1);
        break;
      case "shippingUnavailable":
      case "shippingRequired":
        goTo(2);
        break;
      default:
        break;
    }
    toast.error(message, { duration: 8000 });
  }

  function submitOrder() {
    if (!addressId || !chosenMethod || !payment) return;
    startPlacing(async () => {
      const result = await placeOrder({
        addressId,
        shippingMethod: chosenMethod,
        paymentMethod: payment,
        note,
        couponCode: coupon?.code ?? null,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        expectedTotal: totals.total,
        locale,
      }).catch((): PlaceOrderResult => ({ ok: false, error: "server" }));

      if (result.ok) {
        // The order exists now: only at this point is the cart emptied.
        setPlaced(true);
        clearCart();
        router.push(result.nextUrl);
      } else {
        handleError(result);
      }
    });
  }

  const paymentOptions: { id: PaymentMethodId; disabledReason: string | null }[] = [
    ...(onlinePayment ? [{ id: "ONLINE" as const, disabledReason: null }] : []),
    { id: "COD", disabledReason: null },
    { id: "BANK_TRANSFER", disabledReason: isWholesale ? null : t("checkout.payment.wholesaleOnly") },
  ];
  const paymentValid =
    payment !== null && paymentOptions.some((option) => option.id === payment && !option.disabledReason);

  return (
    <Container className="grid items-start gap-8 pt-8 pb-32 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 lg:pb-12">
      <div className="min-w-0">
        <StepIndicator step={step} maxReached={maxReached} onSelect={setStep} />

        {step === 1 ? (
          <section aria-labelledby="step-address" className="space-y-5">
            <h2 id="step-address" className="text-fluid-lg font-bold">
              {t("checkout.address.title")}
            </h2>
            {addresses.length > 0 ? (
              <fieldset className="space-y-3">
                <legend className="sr-only">{t("checkout.address.choose")}</legend>
                {addresses.map((entry) => (
                  <ChoiceCard
                    key={entry.id}
                    name="address"
                    value={entry.id}
                    checked={entry.id === addressId}
                    onSelect={setAddressId}
                  >
                    <AddressSummary address={entry} />
                  </ChoiceCard>
                ))}
              </fieldset>
            ) : null}

            {addingAddress ? (
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                <h3 className="mb-4 font-semibold">{t("address.formTitle")}</h3>
                <AddressForm
                  defaults={{ receiverName: user.name, receiverPhone: user.phone }}
                  onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
                  onSaved={(saved) => {
                    setAddresses((list) => [...list, saved]);
                    setAddressId(saved.id);
                    setAddingAddress(false);
                    toast.success(t("address.saved"));
                  }}
                />
              </div>
            ) : (
              <Button variant="outline" size="lg" className="h-11 rounded-full px-5" onClick={() => setAddingAddress(true)}>
                <PlusIcon aria-hidden="true" />
                {t("address.addNew")}
              </Button>
            )}

            <div className="flex justify-end">
              <Button size="lg" className="h-12 rounded-full px-8 text-base" disabled={!address || addingAddress} onClick={() => goTo(2)}>
                {t("checkout.continueToShipping")}
              </Button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section aria-labelledby="step-shipping" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="step-shipping" className="text-fluid-lg font-bold">
                {t("checkout.shipping.title")}
              </h2>
              {address ? (
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <PencilIcon className="size-3.5" aria-hidden="true" />
                  {t("checkout.shipping.to", { title: address.title })}
                </button>
              ) : null}
            </div>
            <fieldset className="space-y-3">
              <legend className="sr-only">{t("checkout.shipping.choose")}</legend>
              {shipping.methods.filter((entry) => entry.isActive).map((entry) => {
                const availability = shippingAvailability(shipping, entry.id, destination);
                const base = calculateShipping(shipping, entry.id, totals.weightGrams, destination);
                const cost = applyFreeShipping(shipping, base, afterDiscount);
                const reasonId = `shipping-${entry.id}-reason`;
                return (
                  <ChoiceCard
                    key={entry.id}
                    name="shipping"
                    value={entry.id}
                    checked={method === entry.id && availability.available}
                    disabled={!availability.available}
                    onSelect={() => setMethod(entry.id)}
                    describedBy={reasonId}
                    aside={
                      availability.available && cost !== null
                        ? cost === 0
                          ? t("cart.shippingFree")
                          : price(cost)
                        : null
                    }
                  >
                    <span className="block font-semibold">{t(`checkout.shipping.methods.${entry.id}.name`)}</span>
                    <span id={reasonId} className="mt-0.5 block text-xs text-muted-foreground">
                      {!availability.available
                        ? t(`checkout.shipping.unavailable.${availability.reason}`)
                        : entry.id === "pickup"
                          ? t("checkout.shipping.pickupAt", {
                              address: shipping.pickupAddress?.[locale] ?? "",
                            })
                          : entry.estimatedDays.min === 0
                            ? t("checkout.shipping.sameDay")
                            : t("checkout.shipping.days", {
                                min: formatNumber(entry.estimatedDays.min, locale),
                                max: formatNumber(entry.estimatedDays.max, locale),
                              })}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t(`checkout.shipping.methods.${entry.id}.description`)}
                    </span>
                  </ChoiceCard>
                );
              })}
            </fieldset>
            {totals.freeShippingShortfall !== null && chosenMethod !== "pickup" ? (
              <p className="text-sm text-muted-foreground">
                {t("cart.freeShippingHint", { amount: price(totals.freeShippingShortfall) })}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="ghost" size="lg" className="h-12 rounded-full px-5" onClick={() => setStep(1)}>
                {t("checkout.back")}
              </Button>
              <Button size="lg" className="h-12 rounded-full px-8 text-base" disabled={!chosenMethod} onClick={() => goTo(3)}>
                {t("checkout.continueToPayment")}
              </Button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section aria-labelledby="step-payment" className="space-y-5">
            <h2 id="step-payment" className="text-fluid-lg font-bold">
              {t("checkout.payment.title")}
            </h2>
            <fieldset className="space-y-3">
              <legend className="sr-only">{t("checkout.payment.choose")}</legend>
              {paymentOptions.map(({ id, disabledReason }) => {
                const Icon = paymentIcons[id];
                const descriptionId = `payment-${id}-description`;
                return (
                  <ChoiceCard
                    key={id}
                    name="payment"
                    value={id}
                    checked={payment === id && !disabledReason}
                    disabled={disabledReason !== null}
                    onSelect={() => setPayment(id)}
                    describedBy={descriptionId}
                    aside={<Icon className="size-5 text-brand-gold" aria-hidden="true" />}
                  >
                    <span className="block font-semibold">{t(`checkout.payment.methods.${id}.name`)}</span>
                    <span id={descriptionId} className="mt-0.5 block text-xs text-muted-foreground">
                      {disabledReason ?? t(`checkout.payment.methods.${id}.description`)}
                    </span>
                  </ChoiceCard>
                );
              })}
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="order-note">{t("checkout.note.label")}</Label>
              <Textarea
                id="order-note"
                rows={3}
                maxLength={ORDER_NOTE_MAX}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("checkout.note.placeholder")}
                aria-describedby="order-note-count"
                className="rounded-xl px-3.5 py-3"
              />
              <p id="order-note-count" className="text-end text-xs text-muted-foreground">
                {t("checkout.note.count", {
                  count: formatNumber(note.length, locale),
                  max: formatNumber(ORDER_NOTE_MAX, locale),
                })}
              </p>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="ghost" size="lg" className="h-12 rounded-full px-5" onClick={() => setStep(2)} disabled={placing}>
                {t("checkout.back")}
              </Button>
              <Button
                size="lg"
                className="h-12 rounded-full px-8 text-base"
                disabled={!paymentValid || !chosenMethod || !address || placing || placed}
                onClick={submitOrder}
              >
                {placing || placed
                  ? t("checkout.placing")
                  : payment === "ONLINE"
                    ? t("checkout.placeAndPay", { total: price(totals.total) })
                    : t("checkout.placeOrder", { total: price(totals.total) })}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("checkout.terms")}</p>
          </section>
        ) : null}
      </div>

      <CheckoutSummary items={items} totals={totals} coupon={coupon} shippingChosen={step >= 2 && chosenMethod !== null} />
    </Container>
  );
}
