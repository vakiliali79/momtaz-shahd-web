"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";

import { AdminCard } from "@/components/admin/admin-ui";
import { NumberField, SwitchField, TextField } from "@/components/admin/form-fields";
import { LocalizedTabs } from "@/components/admin/localized-tabs";
import { useSaveSettings } from "@/components/admin/settings/use-save-settings";
import { Button } from "@/components/ui/button";
import { emptyLocalized } from "@/lib/admin/validation";
import { formatDate, formatNumber } from "@/lib/format";
import {
  announcementSettingSchema,
  bankTransferSettingSchema,
  contactSettingSchema,
  exchangeRatesSettingSchema,
  socialKeys,
} from "@/lib/settings-schemas";
import type { z } from "zod";

function SaveButton({ pending }: { pending: boolean }) {
  const t = useTranslations("admin.settings");
  return (
    <div className="flex justify-end">
      <Button type="submit" size="lg" disabled={pending} className="h-11 rounded-full px-8">
        {pending ? t("saving") : t("save")}
      </Button>
    </div>
  );
}

type RatesInput = z.input<typeof exchangeRatesSettingSchema>;
type RatesOutput = z.output<typeof exchangeRatesSettingSchema>;

export function CurrencySettingsForm({ initial }: { initial: RatesOutput | null }) {
  const t = useTranslations("admin.settings.currency");
  const locale = useLocale();
  const save = useSaveSettings();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RatesInput, unknown, RatesOutput>({
    resolver: zodResolver(exchangeRatesSettingSchema),
    defaultValues: initial ?? { base: "IRT", rates: { USD: 0, AED: 0 }, showApproximate: false, updatedAt: null },
  });
  const [usd, aed] = useWatch({ control, name: ["rates.USD", "rates.AED"] });
  const sample = 1_000_000;

  return (
    <form noValidate className="space-y-6" onSubmit={handleSubmit(async (values) => void (await save({ exchangeRates: values })))}>
      <AdminCard title={t("title")}>
        <p className="mb-4 text-sm text-muted-foreground">{t("description")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField<RatesInput> name="rates.USD" label={t("usd")} hint={t("rateHint")} register={register} error={errors.rates?.USD} />
          <NumberField<RatesInput> name="rates.AED" label={t("aed")} hint={t("rateHint")} register={register} error={errors.rates?.AED} />
        </div>
        <SwitchField<RatesInput> name="showApproximate" label={t("show")} hint={t("showHint")} control={control} className="mt-4" />
        {Number(usd) > 0 || Number(aed) > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {t("example", {
              toman: formatNumber(sample, locale),
              usd: Number(usd) > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(sample / Number(usd)) : "—",
              aed: Number(aed) > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "AED", maximumFractionDigits: 2 }).format(sample / Number(aed)) : "—",
            })}
          </p>
        ) : null}
        {initial?.updatedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("updatedAt", { date: formatDate(initial.updatedAt, locale, { dateStyle: "medium", timeStyle: "short" }) })}
          </p>
        ) : null}
      </AdminCard>
      <SaveButton pending={isSubmitting} />
    </form>
  );
}

type ContactInput = z.input<typeof contactSettingSchema>;
type ContactOutput = z.output<typeof contactSettingSchema>;

export function ContactSettingsForm({ initial }: { initial: ContactOutput | null }) {
  const t = useTranslations("admin.settings.contact");
  const save = useSaveSettings();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput, unknown, ContactOutput>({
    resolver: zodResolver(contactSettingSchema),
    defaultValues: initial ?? {
      phone: "",
      whatsapp: "",
      email: "",
      instagram: "",
      address: emptyLocalized(),
      workingHours: emptyLocalized(),
      social: { telegram: "", aparat: "", linkedin: "", eitaa: "" },
    },
  });

  return (
    <form noValidate className="space-y-6" onSubmit={handleSubmit(async (values) => void (await save({ contact: values })))}>
      <AdminCard title={t("title")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<ContactInput> name="phone" label={t("phone")} dir="ltr" placeholder="+98 21 1234 5678" register={register} error={errors.phone} />
          <TextField<ContactInput> name="whatsapp" label={t("whatsapp")} dir="ltr" placeholder="+989121234567" register={register} error={errors.whatsapp} />
          <TextField<ContactInput> name="email" label={t("email")} dir="ltr" placeholder="info@example.com" register={register} error={errors.email} />
          <TextField<ContactInput> name="instagram" label={t("instagram")} dir="ltr" placeholder="momtaz_shahd" register={register} error={errors.instagram} />
        </div>
        <div className="mt-4">
          <LocalizedTabs
            hasError={(code) => Boolean(errors.address?.[code] || errors.workingHours?.[code])}
            render={(code) => (
              <>
                <TextField<ContactInput> name={`address.${code}`} label={t("address")} register={register} error={errors.address?.[code]} multiline rows={2} />
                <TextField<ContactInput> name={`workingHours.${code}`} label={t("hours")} register={register} error={errors.workingHours?.[code]} />
              </>
            )}
          />
        </div>
      </AdminCard>
      <AdminCard title={t("social")}>
        <p className="mb-4 text-sm text-muted-foreground">{t("socialHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {socialKeys.map((key) => (
            <TextField<ContactInput> key={key} name={`social.${key}`} label={t(`networks.${key}`)} dir="ltr" placeholder="https://" register={register} error={errors.social?.[key]} />
          ))}
        </div>
      </AdminCard>
      <SaveButton pending={isSubmitting} />
    </form>
  );
}

type BannerInput = z.input<typeof announcementSettingSchema>;
type BannerOutput = z.output<typeof announcementSettingSchema>;

export function AnnouncementSettingsForm({ initial }: { initial: BannerOutput | null }) {
  const t = useTranslations("admin.settings.announcement");
  const save = useSaveSettings();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BannerInput, unknown, BannerOutput>({
    resolver: zodResolver(announcementSettingSchema),
    defaultValues: initial ?? { enabled: false, text: emptyLocalized(), link: "" },
  });

  return (
    <form noValidate className="space-y-6" onSubmit={handleSubmit(async (values) => void (await save({ announcementBanner: values })))}>
      <AdminCard title={t("title")}>
        <SwitchField<BannerInput> name="enabled" label={t("enabled")} hint={t("enabledHint")} control={control} className="mb-4" />
        <LocalizedTabs
          hasError={(code) => Boolean(errors.text?.[code])}
          render={(code) => <TextField<BannerInput> name={`text.${code}`} label={t("text")} hint={t("textHint")} register={register} error={errors.text?.[code]} />}
        />
        <TextField<BannerInput> name="link" label={t("link")} hint={t("linkHint")} dir="ltr" placeholder="/products" register={register} error={errors.link} className="mt-4" />
      </AdminCard>
      <SaveButton pending={isSubmitting} />
    </form>
  );
}

type BankInput = z.input<typeof bankTransferSettingSchema>;
type BankOutput = z.output<typeof bankTransferSettingSchema>;

export function BankSettingsForm({ initial }: { initial: BankOutput | null }) {
  const t = useTranslations("admin.settings.bank");
  const save = useSaveSettings();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BankInput, unknown, BankOutput>({
    resolver: zodResolver(bankTransferSettingSchema),
    defaultValues: initial ?? { bankName: emptyLocalized(), accountHolder: emptyLocalized(), sheba: "", cardNumber: "" },
  });

  return (
    <form noValidate className="space-y-6" onSubmit={handleSubmit(async (values) => void (await save({ bankTransfer: values })))}>
      <AdminCard title={t("title")}>
        <p className="mb-4 text-sm text-muted-foreground">{t("description")}</p>
        <LocalizedTabs
          hasError={(code) => Boolean(errors.bankName?.[code] || errors.accountHolder?.[code])}
          render={(code) => (
            <>
              <TextField<BankInput> name={`bankName.${code}`} label={t("bankName")} register={register} error={errors.bankName?.[code]} />
              <TextField<BankInput> name={`accountHolder.${code}`} label={t("accountHolder")} register={register} error={errors.accountHolder?.[code]} />
            </>
          )}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField<BankInput> name="sheba" label={t("sheba")} dir="ltr" placeholder="IR000000000000000000000000" register={register} error={errors.sheba} />
          <TextField<BankInput> name="cardNumber" label={t("cardNumber")} dir="ltr" placeholder="0000-0000-0000-0000" register={register} error={errors.cardNumber} />
        </div>
      </AdminCard>
      <SaveButton pending={isSubmitting} />
    </form>
  );
}
