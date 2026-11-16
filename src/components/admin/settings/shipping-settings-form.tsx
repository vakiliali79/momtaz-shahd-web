"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFieldArray, useForm, useWatch, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { z } from "zod";

import { AdminCard } from "@/components/admin/admin-ui";
import { NumberField, SelectField, SwitchField, TextField } from "@/components/admin/form-fields";
import { LocalizedTabs } from "@/components/admin/localized-tabs";
import { useSaveSettings } from "@/components/admin/settings/use-save-settings";
import { Button } from "@/components/ui/button";
import { emptyLocalized } from "@/lib/admin/validation";
import { getProvince, sortedCities, sortedProvinces } from "@/lib/locations";
import { freeShippingSettingSchema, shippingMethodSchema, shippingRateSchema, type ShippingSetting } from "@/lib/settings-schemas";
import { shippingMethodIds } from "@/lib/shipping";

const localizedOptional = z.object({ fa: z.string().trim().max(300, "tooLong"), en: z.string().trim().max(300, "tooLong"), ar: z.string().trim().max(300, "tooLong") });

const methodFormSchema = shippingMethodSchema
  .omit({ outOfProvince: true, provinceRates: true })
  .extend({
    outEnabled: z.boolean(),
    outOfProvince: shippingRateSchema,
    provinceRates: z.array(shippingRateSchema.extend({ province: z.string().min(1, "required") })),
  })
  .superRefine((method, ctx) => {
    if (method.estimatedDays.min > method.estimatedDays.max) {
      ctx.addIssue({ code: "custom", path: ["estimatedDays", "max"], message: "invalid" });
    }
    const seen = new Set<string>();
    method.provinceRates.forEach((rate, index) => {
      if (seen.has(rate.province)) ctx.addIssue({ code: "custom", path: ["provinceRates", index, "province"], message: "invalid" });
      seen.add(rate.province);
    });
  });

const formSchema = z.object({
  origin: z.object({ province: z.string().min(1, "required"), city: z.string().min(1, "required") }),
  pickupAddress: localizedOptional,
  methods: z.array(methodFormSchema),
  freeShipping: freeShippingSettingSchema,
});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const zeroRate = { baseCost: 0, perExtraKg: 0 };

function toForm(shipping: ShippingSetting | null, free: { enabled: boolean; threshold: number } | null): FormInput {
  return {
    origin: shipping?.origin ?? { province: "", city: "" },
    pickupAddress: shipping?.pickupAddress ?? emptyLocalized(),
    methods: shippingMethodIds.map((id) => {
      const method = shipping?.methods.find((entry) => entry.id === id);
      return {
        id,
        isActive: method?.isActive ?? false,
        baseWeightGrams: method?.baseWeightGrams ?? 1000,
        inProvince: method?.inProvince ?? zeroRate,
        outEnabled: Boolean(method?.outOfProvince),
        outOfProvince: method?.outOfProvince ?? zeroRate,
        provinceRates: Object.entries(method?.provinceRates ?? {}).map(([province, rate]) => ({ province, ...rate })),
        sameCityOnly: method?.sameCityOnly ?? id === "courier",
        estimatedDays: method?.estimatedDays ?? { min: 1, max: 3 },
      };
    }),
    freeShipping: free ?? { enabled: false, threshold: 0 },
  };
}

function ProvinceRates({ index, control, register, errors }: {
  index: number;
  control: Control<FormInput>;
  register: UseFormRegister<FormInput>;
  errors: FieldErrors<FormInput>;
}) {
  const t = useTranslations("admin.settings.shipping");
  const locale = useLocale();
  const { fields, append, remove } = useFieldArray({ control, name: `methods.${index}.provinceRates` });
  const provinces = sortedProvinces(locale).map((entry) => ({ value: entry.id, label: entry.name[locale] }));
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">{t("provinceRates")}</h4>
        <p className="text-xs text-muted-foreground">{t("provinceRatesHint")}</p>
      </div>
      {fields.map((field, rateIndex) => {
        const rateErrors = errors.methods?.[index]?.provinceRates?.[rateIndex];
        return (
          <div key={field.id} className="grid items-end gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <SelectField<FormInput> name={`methods.${index}.provinceRates.${rateIndex}.province`} label={t("province")} control={control} options={provinces} placeholder={t("choose")} error={rateErrors?.province} />
            <NumberField<FormInput> name={`methods.${index}.provinceRates.${rateIndex}.baseCost`} label={t("baseCost")} register={register} error={rateErrors?.baseCost} />
            <NumberField<FormInput> name={`methods.${index}.provinceRates.${rateIndex}.perExtraKg`} label={t("perExtraKg")} register={register} error={rateErrors?.perExtraKg} />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(rateIndex)} aria-label={t("removeRate")}>
              <Trash2Icon className="text-destructive" aria-hidden="true" />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => append({ province: "", baseCost: 0, perExtraKg: 0 })}>
        <PlusIcon aria-hidden="true" />
        {t("addRate")}
      </Button>
    </div>
  );
}

export function ShippingSettingsForm({
  shipping,
  freeShipping,
}: {
  shipping: ShippingSetting | null;
  freeShipping: { enabled: boolean; threshold: number } | null;
}) {
  const t = useTranslations("admin.settings.shipping");
  const tMethods = useTranslations("checkout.shipping.methods");
  const locale = useLocale();
  const save = useSaveSettings();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(formSchema), defaultValues: toForm(shipping, freeShipping) });
  const originProvince = getProvince(useWatch({ control, name: "origin.province" }));
  const methods = useWatch({ control, name: "methods" });

  useEffect(() => {
    const city = getValues("origin.city");
    if (city && !originProvince?.cities.some((entry) => entry.id === city)) setValue("origin.city", "");
  }, [originProvince, getValues, setValue]);

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const field = await save({
          shipping: {
            schemaVersion: 2,
            origin: values.origin,
            pickupAddress: Object.values(values.pickupAddress).some(Boolean) ? values.pickupAddress : null,
            methods: values.methods.map(({ outEnabled, outOfProvince, provinceRates, ...method }) => ({
              ...method,
              outOfProvince: outEnabled ? outOfProvince : null,
              provinceRates: Object.fromEntries(provinceRates.map(({ province, ...rate }) => [province, rate])),
            })),
          },
          freeShipping: values.freeShipping,
        });
        if (field) setError("root", { message: field });
      })}
    >
      <AdminCard title={t("origin")}>
        <p className="mb-4 text-sm text-muted-foreground">{t("originHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField<FormInput> name="origin.province" label={t("province")} control={control} error={errors.origin?.province} placeholder={t("choose")} options={sortedProvinces(locale).map((entry) => ({ value: entry.id, label: entry.name[locale] }))} />
          <SelectField<FormInput> name="origin.city" label={t("city")} control={control} error={errors.origin?.city} placeholder={t("choose")} options={originProvince ? sortedCities(originProvince, locale).map((entry) => ({ value: entry.id, label: entry.name[locale] })) : []} />
        </div>
        <div className="mt-4">
          <LocalizedTabs
            hasError={(code) => Boolean(errors.pickupAddress?.[code])}
            render={(code) => <TextField<FormInput> name={`pickupAddress.${code}`} label={t("pickupAddress")} register={register} error={errors.pickupAddress?.[code]} />}
          />
        </div>
      </AdminCard>

      <AdminCard title={t("freeTitle")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField<FormInput> name="freeShipping.enabled" label={t("freeEnabled")} control={control} />
          <NumberField<FormInput> name="freeShipping.threshold" label={t("freeThreshold")} hint={t("freeThresholdHint")} register={register} error={errors.freeShipping?.threshold} />
        </div>
      </AdminCard>

      {methods.map((method, index) => {
        const methodErrors = errors.methods?.[index];
        const isPickup = method.id === "pickup";
        return (
          <AdminCard key={method.id} title={tMethods(`${method.id}.name`)}>
            <div className="space-y-4">
              <SwitchField<FormInput> name={`methods.${index}.isActive`} label={t("methodActive")} control={control} />
              {method.isActive ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <NumberField<FormInput> name={`methods.${index}.estimatedDays.min`} label={t("daysMin")} register={register} error={methodErrors?.estimatedDays?.min} />
                    <NumberField<FormInput> name={`methods.${index}.estimatedDays.max`} label={t("daysMax")} register={register} error={methodErrors?.estimatedDays?.max} />
                    {!isPickup ? (
                      <NumberField<FormInput> name={`methods.${index}.baseWeightGrams`} label={t("baseWeight")} hint={t("baseWeightHint")} register={register} error={methodErrors?.baseWeightGrams} />
                    ) : null}
                  </div>
                  {!isPickup ? (
                    <>
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">{t("inProvince")}</legend>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <NumberField<FormInput> name={`methods.${index}.inProvince.baseCost`} label={t("baseCost")} register={register} error={methodErrors?.inProvince?.baseCost} />
                          <NumberField<FormInput> name={`methods.${index}.inProvince.perExtraKg`} label={t("perExtraKg")} register={register} error={methodErrors?.inProvince?.perExtraKg} />
                        </div>
                      </fieldset>
                      <SwitchField<FormInput> name={`methods.${index}.sameCityOnly`} label={t("sameCityOnly")} hint={t("sameCityOnlyHint")} control={control} />
                      {!method.sameCityOnly ? (
                        <>
                          <SwitchField<FormInput> name={`methods.${index}.outEnabled`} label={t("outEnabled")} control={control} />
                          {method.outEnabled ? (
                            <fieldset className="space-y-2">
                              <legend className="text-sm font-medium">{t("outOfProvince")}</legend>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <NumberField<FormInput> name={`methods.${index}.outOfProvince.baseCost`} label={t("baseCost")} register={register} error={methodErrors?.outOfProvince?.baseCost} />
                                <NumberField<FormInput> name={`methods.${index}.outOfProvince.perExtraKg`} label={t("perExtraKg")} register={register} error={methodErrors?.outOfProvince?.perExtraKg} />
                              </div>
                            </fieldset>
                          ) : null}
                          <ProvinceRates index={index} control={control} register={register} errors={errors} />
                        </>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          </AdminCard>
        );
      })}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-8">
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
