"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { sendContactMessage } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  contactSchema,
  toContactErrorKey,
  type ContactInput,
} from "@/lib/validation/contact";

const fieldNames = ["name", "phone", "email", "subject", "message"] as const;
type FieldName = (typeof fieldNames)[number];

function isFieldName(value: string | undefined): value is FieldName {
  return fieldNames.some((name) => name === value);
}

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const id = useId();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      subject: "",
      message: "",
      locale,
      website: "",
    },
  });

  async function onSubmit(values: ContactInput) {
    try {
      const result = await sendContactMessage(values);
      if (result.ok) {
        reset();
        setSent(true);
      } else if (isFieldName(result.field)) {
        setError(result.field, { message: result.error });
      } else {
        toast.error(t("errors.server"));
      }
    } catch {
      toast.error(t("errors.server"));
    }
  }

  if (sent) {
    return (
      <div role="status" className="grid place-items-center gap-3 py-10 text-center">
        <CircleCheckIcon className="size-12 text-brand-leaf" aria-hidden="true" />
        <h3 className="text-fluid-lg font-semibold">{t("successTitle")}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{t("successText")}</p>
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
        {t(`errors.${toContactErrorKey(message)}`)}
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
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${id}-name`}>{t("fields.name")}</Label>
        <Input autoComplete="name" className={inputClass} {...aria("name")} {...register("name")} />
        {error("name")}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-phone`}>{t("fields.phone")}</Label>
        <Input
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          placeholder="09xxxxxxxxx"
          className={`${inputClass} text-start placeholder:text-start`}
          {...aria("phone")}
          {...register("phone")}
        />
        {error("phone")}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-email`}>{t("fields.email")}</Label>
        <Input
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={`${inputClass} text-start placeholder:text-start`}
          {...aria("email")}
          {...register("email")}
        />
        {error("email")}
      </div>
      <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">{t("contactHint")}</p>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${id}-subject`}>{t("fields.subject")}</Label>
        <Input className={inputClass} {...aria("subject")} {...register("subject")} />
        {error("subject")}
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${id}-message`}>{t("fields.message")}</Label>
        <Textarea rows={6} className="rounded-xl px-3.5 py-3" {...aria("message")} {...register("message")} />
        {error("message")}
      </div>
      {/* Honeypot field: hidden from people, tempting for bots. */}
      <div aria-hidden="true" className="hidden">
        <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 w-full rounded-full px-8 text-base sm:w-auto">
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
