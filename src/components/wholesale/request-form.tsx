"use client";

import { useEffect, useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { submitWholesaleRequest } from "@/actions/wholesale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getProvince, sortedCities, sortedProvinces } from "@/lib/locations";
import { toWholesaleErrorKey, wholesaleRequestSchema, type WholesaleRequestInput } from "@/lib/validation/wholesale";

const fieldNames = ["companyName", "contactName", "phone", "email", "province", "city", "products", "estimatedQty", "message"] as const;
type FieldName = (typeof fieldNames)[number];

function isFieldName(value: string | undefined): value is FieldName {
  return fieldNames.some((name) => name === value);
}

/**
 * Wholesale request (`type` WHOLESALE) or dealership application (AGENCY).
 * Both land in Admin → Wholesale requests.
 */
export function WholesaleRequestForm({ type }: { type: "WHOLESALE" | "AGENCY" }) {
  const t = useTranslations("wholesaleForm");
  const locale = useLocale();
  const id = useId();
  const [sent, setSent] = useState(false);
  const variant = type === "AGENCY" ? "dealer" : "wholesale";
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<WholesaleRequestInput>({
    resolver: zodResolver(wholesaleRequestSchema),
    defaultValues: {
      type,
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      province: "",
      city: "",
      products: "",
      estimatedQty: "",
      message: "",
      locale,
      website: "",
    },
  });
  const province = getProvince(useWatch({ control, name: "province" }));

  // A new province clears a city that does not belong to it.
  useEffect(() => {
    const city = getValues("city");
    if (city && !province?.cities.some((entry) => entry.id === city)) setValue("city", "");
  }, [province, getValues, setValue]);

  async function onSubmit(values: WholesaleRequestInput) {
    const result = await submitWholesaleRequest(values).catch(() => ({ ok: false as const, error: "server" as const, field: undefined }));
    if (result.ok) {
      reset();
      setSent(true);
    } else if (isFieldName(result.field)) {
      setError(result.field, { message: result.error });
    } else {
      toast.error(t(`errors.${result.error}`));
    }
  }

  if (sent) {
    return (
      <div role="status" className="grid place-items-center gap-3 py-10 text-center">
        <CircleCheckIcon className="size-12 text-leaf-ink" aria-hidden="true" />
        <h3 className="text-fluid-lg font-semibold">{t(`${variant}.successTitle`)}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{t(`${variant}.successText`)}</p>
        <Button variant="outline" size="lg" className="mt-2 rounded-full px-5" onClick={() => setSent(false)}>
          {t("sendAnother")}
        </Button>
      </div>
    );
  }

  const error = (name: FieldName) => {
    const message = errors[name]?.message;
    return message ? (
      <p id={`${id}-${name}-error`} role="alert" className="text-sm text-destructive">
        {t(`errors.${toWholesaleErrorKey(message)}`)}
      </p>
    ) : null;
  };
  const aria = (name: FieldName) => ({
    id: `${id}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });
  const inputClass = "h-11 rounded-xl px-3.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${id}-companyName`}>{t(`${variant}.company`)}</Label>
        <Input autoComplete="organization" className={inputClass} {...aria("companyName")} {...register("companyName")} />
        {error("companyName")}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-contactName`}>{t("fields.contactName")}</Label>
        <Input autoComplete="name" className={inputClass} {...aria("contactName")} {...register("contactName")} />
        {error("contactName")}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-phone`}>{t("fields.phone")}</Label>
        <Input type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="09xxxxxxxxx" className={`${inputClass} text-start placeholder:text-start`} {...aria("phone")} {...register("phone")} />
        {error("phone")}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-email`}>{t("fields.email")}</Label>
        <Input type="email" dir="ltr" inputMode="email" autoComplete="email" placeholder="you@example.com" className={`${inputClass} text-start placeholder:text-start`} {...aria("email")} {...register("email")} />
        {error("email")}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-province`}>{t("fields.province")}</Label>
        <Controller
          control={control}
          name="province"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger {...aria("province")} className="h-11! w-full rounded-xl px-3.5">
                <SelectValue placeholder={t("fields.choose")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {sortedProvinces(locale).map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>{entry.name[locale]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {error("province")}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-city`}>{t("fields.city")}</Label>
        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={!province}>
              <SelectTrigger {...aria("city")} className="h-11! w-full rounded-xl px-3.5">
                <SelectValue placeholder={province ? t("fields.choose") : t("fields.provinceFirst")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {province
                  ? sortedCities(province, locale).map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>{entry.name[locale]}</SelectItem>
                    ))
                  : null}
              </SelectContent>
            </Select>
          )}
        />
        {error("city")}
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${id}-products`}>{t(`${variant}.products`)}</Label>
        <Textarea rows={3} placeholder={t(`${variant}.productsPlaceholder`)} className="rounded-xl px-3.5 py-3" {...aria("products")} {...register("products")} />
        {error("products")}
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${id}-estimatedQty`}>{t("fields.estimatedQty")}</Label>
        <Input placeholder={t("fields.estimatedQtyPlaceholder")} className={inputClass} {...aria("estimatedQty")} {...register("estimatedQty")} />
        {error("estimatedQty")}
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${id}-message`}>{t(`${variant}.message`)}</Label>
        <Textarea rows={4} className="rounded-xl px-3.5 py-3" {...aria("message")} {...register("message")} />
        {error("message")}
      </div>
      {/* Honeypot field: hidden from people, tempting for bots. */}
      <div aria-hidden="true" className="hidden">
        <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-2">{t("privacy")}</p>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 w-full rounded-full px-8 text-base sm:w-auto">
          {isSubmitting ? t("submitting") : t(`${variant}.submit`)}
        </Button>
      </div>
    </form>
  );
}
