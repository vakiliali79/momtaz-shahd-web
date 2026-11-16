"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { Controller, useForm, type FieldValues, type Path, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";

import { changePassword, updateProfile, type ProfileResult } from "@/actions/profile";
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
import { localeMeta } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  passwordSchema,
  profileSchema,
  toProfileErrorKey,
  type PasswordInput,
  type ProfileInput,
} from "@/lib/validation/profile";

function FieldError({ id, message }: { id: string; message?: string }) {
  const t = useTranslations("accountPages.profile.errors");
  return message ? (
    <p id={id} role="alert" className="text-sm text-destructive">
      {t(toProfileErrorKey(message))}
    </p>
  ) : null;
}

function TextField<T extends FieldValues>({
  name,
  label,
  register,
  error,
  type = "text",
  autoComplete,
  ltr = false,
  hint,
}: {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  ltr?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        dir={ltr ? "ltr" : undefined}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined}
        className="h-11 rounded-xl px-3.5 text-start"
        {...register(name)}
      />
      {hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function applyResult<T extends FieldValues>(
  result: ProfileResult,
  fields: readonly Path<T>[],
  setError: (name: Path<T>, error: { message: string }) => void,
  onFormError: (message: string) => void,
): boolean {
  if (result.ok) return true;
  const field = fields.find((name) => name === result.field);
  if (field) setError(field, { message: result.error });
  else onFormError(result.error);
  return false;
}

export function ProfileForm({
  initial,
  phone,
}: {
  initial: { name: string; email: string; preferredLocale: AppLocale };
  phone: string;
}) {
  const t = useTranslations("accountPages.profile");
  const tErrors = useTranslations("accountPages.profile.errors");
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const localeId = useId();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: initial });

  return (
    <form
      noValidate
      className="grid gap-5 sm:grid-cols-2"
      onSubmit={handleSubmit(async (values) => {
        const result = await updateProfile(values).catch((): ProfileResult => ({ ok: false, error: "server" }));
        const ok = applyResult<ProfileInput>(result, ["name", "email", "preferredLocale"], setError, (message) =>
          toast.error(tErrors(toProfileErrorKey(message))),
        );
        if (!ok) return;
        toast.success(t("saved"));
        // Switch the site to the newly preferred language, keeping this page.
        if (values.preferredLocale !== initial.preferredLocale) {
          router.replace(pathname, { locale: values.preferredLocale });
        } else {
          nextRouter.refresh();
        }
      })}
    >
      <div className="sm:col-span-2">
        <TextField<ProfileInput> name="name" label={t("name")} autoComplete="name" register={register} error={errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label>{t("phone")}</Label>
        <p className="flex h-11 items-center rounded-xl border border-input bg-muted/60 px-3.5 text-sm text-muted-foreground" dir="ltr">
          {phone}
        </p>
        <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
      </div>
      <TextField<ProfileInput> name="email" type="email" label={t("email")} autoComplete="email" ltr register={register} error={errors.email?.message} />
      <div className="space-y-2">
        <Label htmlFor={localeId}>{t("language")}</Label>
        <Controller
          control={control}
          name="preferredLocale"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={localeId} className="h-11! w-full rounded-xl px-3.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routing.locales.map((code) => (
                  <SelectItem key={code} value={code} lang={code}>
                    {localeMeta[code].nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError id={`${localeId}-error`} message={errors.preferredLocale?.message} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-6">
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations("accountPages.profile");
  const tErrors = useTranslations("accountPages.profile.errors");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  return (
    <form
      noValidate
      className="grid gap-5 sm:grid-cols-2"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        const result = await changePassword(values).catch((): ProfileResult => ({ ok: false, error: "server" }));
        const fields = ["currentPassword", "newPassword", "confirmPassword"] as const;
        if (applyResult<PasswordInput>(result, fields, setError, setFormError)) {
          reset();
          toast.success(t("passwordChanged"));
        }
      })}
    >
      {formError ? (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:col-span-2">
          {tErrors(toProfileErrorKey(formError))}
        </p>
      ) : null}
      {hasPassword ? (
        <div className="sm:col-span-2">
          <TextField<PasswordInput>
            name="currentPassword"
            type="password"
            label={t("currentPassword")}
            autoComplete="current-password"
            ltr
            register={register}
            error={errors.currentPassword?.message}
          />
        </div>
      ) : null}
      <TextField<PasswordInput>
        name="newPassword"
        type="password"
        label={t("newPassword")}
        autoComplete="new-password"
        ltr
        hint={t("passwordHint")}
        register={register}
        error={errors.newPassword?.message}
      />
      <TextField<PasswordInput>
        name="confirmPassword"
        type="password"
        label={t("confirmPassword")}
        autoComplete="new-password"
        ltr
        register={register}
        error={errors.confirmPassword?.message}
      />
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" variant="outline" disabled={isSubmitting} className="h-11 rounded-full px-6">
          {isSubmitting ? t("saving") : t("changePassword")}
        </Button>
      </div>
    </form>
  );
}
