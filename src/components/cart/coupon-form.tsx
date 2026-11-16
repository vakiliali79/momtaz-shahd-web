"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { TicketPercentIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { checkCoupon } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import {
  couponFormSchema,
  toCouponErrorKey,
  type CouponFormInput,
} from "@/lib/validation/coupon";
import { useCartStore } from "@/stores/cart";

export function CouponForm({ subtotal }: { subtotal: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const id = useId();
  const errorId = `${id}-error`;
  const coupon = useCartStore((state) => state.coupon);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  // Minimum order of the last code rejected for being below it.
  const [minOrder, setMinOrder] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormInput>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: { code: "" },
  });

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-brand-leaf/50 bg-brand-leaf/10 px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium text-brand-leaf dark:text-success">
          <TicketPercentIcon className="size-4" aria-hidden="true" />
          {t("cart.coupon.active", { code: coupon.code })}
        </span>
        <button
          type="button"
          aria-label={t("cart.coupon.remove", { code: coupon.code })}
          onClick={removeCoupon}
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-background hover:text-destructive"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  async function onSubmit(values: CouponFormInput) {
    try {
      const result = await checkCoupon({ code: values.code, subtotal });
      if (result.ok) {
        applyCoupon(result.coupon);
        reset();
        toast.success(t("cart.coupon.applied", { code: result.coupon.code }));
      } else {
        setMinOrder(result.minOrder ?? 0);
        setError("code", { message: result.error });
      }
    } catch {
      setError("code", { message: "server" });
    }
  }

  const errorKey = errors.code ? toCouponErrorKey(errors.code.message) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {t("cart.coupon.label")}
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          dir="ltr"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={t("cart.coupon.placeholder")}
          aria-invalid={errorKey ? true : undefined}
          aria-describedby={errorKey ? errorId : undefined}
          className="h-10 min-w-0 flex-1 rounded-full px-4 text-start uppercase placeholder:normal-case"
          {...register("code")}
        />
        <Button
          type="submit"
          variant="outline"
          size="lg"
          disabled={isSubmitting}
          className="h-10 rounded-full px-4"
        >
          {isSubmitting ? t("cart.coupon.applying") : t("cart.coupon.apply")}
        </Button>
      </div>
      {errorKey ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {t(`cart.coupon.errors.${errorKey}`, {
            amount: formatPrice(minOrder, locale, t("common.toman")),
          })}
        </p>
      ) : null}
    </form>
  );
}
