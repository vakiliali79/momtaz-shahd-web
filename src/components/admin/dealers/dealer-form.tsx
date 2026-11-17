"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { saveDealer } from "@/actions/admin/dealers";
import { AdminCard } from "@/components/admin/admin-ui";
import { SelectField, SwitchField, TextField } from "@/components/admin/form-fields";
import { ImageUploader } from "@/components/admin/image-uploader";
import { LocalizedTabs } from "@/components/admin/localized-tabs";
import { MapPicker } from "@/components/map/map-picker";
import { Button } from "@/components/ui/button";
import { dealerSchema, dealerTypes, type DealerInput, type DealerOutput } from "@/lib/admin/dealer-schema";
import { emptyLocalized } from "@/lib/admin/validation";
import { getProvince, IRAN_CENTER, sortedCities, sortedProvinces } from "@/lib/locations";

export function DealerForm({ dealerId, initial }: { dealerId: string | null; initial?: DealerInput }) {
  const t = useTranslations("admin.dealers");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const locale = useLocale();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<DealerInput, unknown, DealerOutput>({
    resolver: zodResolver(dealerSchema),
    defaultValues: initial ?? {
      name: emptyLocalized(),
      address: emptyLocalized(),
      openingHours: emptyLocalized(),
      type: "RETAIL_STORE",
      province: "",
      city: "",
      phone: "",
      whatsapp: "",
      instagram: "",
      location: null,
      images: [],
      isActive: true,
      isVerified: false,
    },
  });
  const provinceId = useWatch({ control, name: "province" });
  const province = getProvince(provinceId);

  // A new province clears a city that does not belong to it.
  useEffect(() => {
    const city = getValues("city");
    if (city && !province?.cities.some((entry) => entry.id === city)) setValue("city", "");
  }, [province, getValues, setValue]);

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const result = await saveDealer(dealerId, values).catch(() => ({ ok: false as const, error: "server" as const, field: undefined }));
        if (result.ok) {
          toast.success(t("form.saved"));
          router.push(`/${locale}/admin/dealers`);
        } else {
          if (result.field) setError(result.field as FieldPath<DealerInput>, { message: result.error });
          toast.error(tErrors(result.error));
        }
      })}
    >
      <AdminCard title={t("form.texts")}>
        <LocalizedTabs
          hasError={(code) => Boolean(errors.name?.[code] || errors.address?.[code] || errors.openingHours?.[code])}
          render={(code) => (
            <>
              <TextField<DealerInput> name={`name.${code}`} label={t("form.name")} register={register} error={errors.name?.[code]} />
              <TextField<DealerInput> name={`address.${code}`} label={t("form.address")} register={register} error={errors.address?.[code]} multiline rows={2} />
              <TextField<DealerInput> name={`openingHours.${code}`} label={t("form.hours")} hint={t("form.hoursHint")} register={register} error={errors.openingHours?.[code]} />
            </>
          )}
        />
      </AdminCard>

      <AdminCard title={t("form.general")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField<DealerInput>
            name="type"
            label={t("form.type")}
            control={control}
            error={errors.type}
            options={dealerTypes.map((value) => ({ value, label: t(`types.${value}`) }))}
          />
          <div className="hidden sm:block" />
          <SelectField<DealerInput>
            name="province"
            label={t("form.province")}
            control={control}
            error={errors.province}
            placeholder={t("form.choose")}
            options={sortedProvinces(locale).map((entry) => ({ value: entry.id, label: entry.name[locale] }))}
          />
          <SelectField<DealerInput>
            name="city"
            label={t("form.city")}
            control={control}
            error={errors.city}
            placeholder={province ? t("form.choose") : t("form.provinceFirst")}
            options={province ? sortedCities(province, locale).map((entry) => ({ value: entry.id, label: entry.name[locale] })) : []}
          />
          <TextField<DealerInput> name="phone" label={t("form.phone")} dir="ltr" placeholder="021-12345678" register={register} error={errors.phone} />
          <TextField<DealerInput> name="whatsapp" label={t("form.whatsapp")} dir="ltr" placeholder="+989121234567" register={register} error={errors.whatsapp} />
          <TextField<DealerInput> name="instagram" label={t("form.instagram")} dir="ltr" placeholder="momtaz_shahd" register={register} error={errors.instagram} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SwitchField<DealerInput> name="isActive" label={t("form.active")} hint={t("form.activeHint")} control={control} />
          <SwitchField<DealerInput> name="isVerified" label={t("form.verified")} hint={t("form.verifiedHint")} control={control} />
        </div>
      </AdminCard>

      <AdminCard title={t("form.location")}>
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <MapPicker value={field.value} onChange={field.onChange} center={province?.center ?? IRAN_CENTER} />
          )}
        />
      </AdminCard>

      <AdminCard title={t("form.image")}>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader value={field.value} onChange={field.onChange} folder="dealers" max={1} label={t("form.image")} />
          )}
        />
      </AdminCard>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-8">
          {isSubmitting ? t("form.saving") : t("form.save")}
        </Button>
      </div>
    </form>
  );
}
