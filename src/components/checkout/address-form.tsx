"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";

import { saveAddress, updateAddress } from "@/actions/address";
import { MapPicker } from "@/components/map/map-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getProvince, IRAN_CENTER, sortedCities, sortedProvinces } from "@/lib/locations";
import type { AddressDto } from "@/lib/orders/types";
import {
  addressSchema,
  toAddressErrorKey,
  type AddressInput,
  type AddressOutput,
} from "@/lib/validation/address";

const fieldNames = [
  "title",
  "province",
  "city",
  "fullAddress",
  "postalCode",
  "receiverName",
  "receiverPhone",
  "lat",
] as const;
type FieldName = (typeof fieldNames)[number];

export function AddressForm({
  defaults,
  initial,
  onSaved,
  onCancel,
}: {
  defaults: { receiverName: string; receiverPhone: string };
  /** An existing address to edit; omit to create a new one. */
  initial?: AddressDto;
  onSaved: (address: AddressDto) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("address");
  const locale = useLocale();
  const id = useId();
  const [showMap, setShowMap] = useState(initial?.lat != null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressInput, unknown, AddressOutput>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          province: initial.province,
          city: initial.city,
          fullAddress: initial.fullAddress,
          postalCode: initial.postalCode,
          receiverName: initial.receiverName,
          receiverPhone: initial.receiverPhone,
          lat: initial.lat,
          lng: initial.lng,
        }
      : {
          title: "",
          province: "",
          city: "",
          fullAddress: "",
          postalCode: "",
          receiverName: defaults.receiverName,
          receiverPhone: defaults.receiverPhone,
          lat: null,
          lng: null,
        },
  });

  const [provinceId, lat, lng] = useWatch({ control, name: ["province", "lat", "lng"] });
  const province = getProvince(provinceId);
  const pin = typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;

  const fieldId = (name: FieldName) => `${id}-${name}`;
  const aria = (name: FieldName) => ({
    id: fieldId(name),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${fieldId(name)}-error` : undefined,
  });
  const error = (name: FieldName) => {
    const message = errors[name]?.message;
    return message ? (
      <p id={`${fieldId(name)}-error`} role="alert" className="text-sm text-destructive">
        {t(`errors.${toAddressErrorKey(message)}`)}
      </p>
    ) : null;
  };
  const inputClass = "h-11 rounded-xl px-3.5";

  async function onSubmit(values: AddressOutput) {
    setFormError(null);
    const result = await (initial ? updateAddress(initial.id, values) : saveAddress(values)).catch(
      () => null,
    );
    if (!result) {
      setFormError("server");
    } else if (result.ok) {
      onSaved(result.address);
    } else {
      const field = fieldNames.find((name) => name === result.field);
      if (field) setError(field, { message: result.error });
      else setFormError(result.error);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // The address form can sit inside the checkout; never submit an outer form.
        event.stopPropagation();
        void handleSubmit(onSubmit)(event);
      }}
      className="grid gap-4 sm:grid-cols-2"
      aria-label={initial ? t("editTitle") : t("formTitle")}
    >
      {formError ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:col-span-2">
          {t(`errors.${toAddressErrorKey(formError)}`)}
        </p>
      ) : null}

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={fieldId("title")}>{t("fields.title")}</Label>
        <Input placeholder={t("fields.titlePlaceholder")} className={inputClass} {...aria("title")} {...register("title")} />
        {error("title")}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("province")}>{t("fields.province")}</Label>
        <Controller
          control={control}
          name="province"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                setValue("city", "", { shouldValidate: false });
              }}
            >
              <SelectTrigger {...aria("province")} className="h-11! w-full rounded-xl px-3.5">
                <SelectValue placeholder={t("fields.provincePlaceholder")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {sortedProvinces(locale).map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name[locale]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {error("province")}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("city")}>{t("fields.city")}</Label>
        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={!province}>
              <SelectTrigger {...aria("city")} className="h-11! w-full rounded-xl px-3.5">
                <SelectValue placeholder={province ? t("fields.cityPlaceholder") : t("fields.cityFirst")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {province
                  ? sortedCities(province, locale).map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.name[locale]}
                      </SelectItem>
                    ))
                  : null}
              </SelectContent>
            </Select>
          )}
        />
        {error("city")}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={fieldId("fullAddress")}>{t("fields.fullAddress")}</Label>
        <Textarea
          rows={3}
          placeholder={t("fields.fullAddressPlaceholder")}
          className="rounded-xl px-3.5 py-3"
          {...aria("fullAddress")}
          {...register("fullAddress")}
        />
        {error("fullAddress")}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("postalCode")}>{t("fields.postalCode")}</Label>
        <Input
          dir="ltr"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={12}
          placeholder="1234567890"
          className={`${inputClass} text-start tabular-nums placeholder:text-start`}
          {...aria("postalCode")}
          {...register("postalCode")}
        />
        {error("postalCode")}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("receiverName")}>{t("fields.receiverName")}</Label>
        <Input autoComplete="name" className={inputClass} {...aria("receiverName")} {...register("receiverName")} />
        {error("receiverName")}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("receiverPhone")}>{t("fields.receiverPhone")}</Label>
        <Input
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          placeholder="09xxxxxxxxx"
          className={`${inputClass} text-start placeholder:text-start`}
          {...aria("receiverPhone")}
          {...register("receiverPhone")}
        />
        {error("receiverPhone")}
      </div>

      <div className="space-y-3 sm:col-span-2">
        {showMap ? (
          <MapPicker
            value={pin}
            center={province?.center ?? IRAN_CENTER}
            onChange={(value) => {
              setValue("lat", value?.lat ?? null);
              setValue("lng", value?.lng ?? null);
            }}
          />
        ) : (
          <Button type="button" variant="outline" size="lg" className="h-10 rounded-full" onClick={() => setShowMap(true)}>
            <MapPinIcon aria-hidden="true" />
            {t("addPin")}
          </Button>
        )}
        {error("lat")}
      </div>

      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-6">
          {isSubmitting ? t("saving") : t("save")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" size="lg" className="h-11 rounded-full px-5" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
