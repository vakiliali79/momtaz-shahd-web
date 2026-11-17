"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { saveCoupon } from "@/actions/admin/coupons";
import { AdminCard } from "@/components/admin/admin-ui";
import { NumberField, SelectField, SwitchField, TextField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { couponSchema, couponTypes, expiryInstant, type CouponInput, type CouponOutput } from "@/lib/admin/coupon-schema";
import { formatDate } from "@/lib/format";

export function CouponForm({ couponId, initial }: { couponId: string | null; initial?: CouponInput }) {
  const t = useTranslations("admin.coupons.form");
  const tTypes = useTranslations("admin.coupons.types");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const locale = useLocale();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CouponInput, unknown, CouponOutput>({
    resolver: zodResolver(couponSchema),
    defaultValues: initial ?? { code: "", type: "PERCENT", value: 10, minOrder: 0, maxUses: null, expiresAt: "", isActive: true },
  });
  const type = useWatch({ control, name: "type" });
  const expiresAt = useWatch({ control, name: "expiresAt" });
  const expiryValid = /^\d{4}-\d{2}-\d{2}$/.test(expiresAt);

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const result = await saveCoupon(couponId, values).catch(() => ({ ok: false as const, error: "server" as const, field: undefined }));
        if (result.ok) {
          toast.success(t("saved"));
          router.push(`/${locale}/admin/coupons`);
        } else {
          if (result.field) setError(result.field as FieldPath<CouponInput>, { message: result.error });
          toast.error(tErrors(result.error));
        }
      })}
    >
      <AdminCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<CouponInput> name="code" label={t("code")} hint={t("codeHint")} dir="ltr" register={register} error={errors.code} />
          <SelectField<CouponInput>
            name="type"
            label={t("type")}
            control={control}
            error={errors.type}
            options={couponTypes.map((value) => ({ value, label: tTypes(value) }))}
          />
          <NumberField<CouponInput>
            name="value"
            label={type === "PERCENT" ? t("percent") : t("amount")}
            register={register}
            error={errors.value}
          />
          <NumberField<CouponInput> name="minOrder" label={t("minOrder")} hint={t("minOrderHint")} register={register} error={errors.minOrder} />
          <NumberField<CouponInput> name="maxUses" label={t("maxUses")} hint={t("maxUsesHint")} register={register} error={errors.maxUses} nullable />
          <div>
            <TextField<CouponInput> name="expiresAt" label={t("expiresAt")} hint={t("expiresHint")} dir="ltr" placeholder="2026-12-31" register={register} error={errors.expiresAt} />
            {expiryValid ? (
              <p className="mt-1 text-xs text-leaf-ink" aria-live="polite">
                {t("expiresPreview", { date: formatDate(expiryInstant(expiresAt).toISOString(), locale, { dateStyle: "full" }) })}
              </p>
            ) : null}
          </div>
        </div>
        <SwitchField<CouponInput> name="isActive" label={t("active")} hint={t("activeHint")} control={control} className="mt-4" />
      </AdminCard>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-8">
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
