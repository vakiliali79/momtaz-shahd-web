"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm, type FieldValues, type Path, type UseFormRegister } from "react-hook-form";

import { login, register as registerUser, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  loginSchema,
  registerSchema,
  toAuthErrorKey,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

type FieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: string;
  type?: "text" | "tel" | "password";
  autoComplete: string;
  hint?: string;
};

function Field<T extends FieldValues>({
  name,
  label,
  register,
  error,
  type = "text",
  autoComplete,
  hint,
}: FieldProps<T>) {
  const t = useTranslations("auth");
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && !visible ? "password" : type === "password" ? "text" : type}
          dir={type === "tel" || isPassword ? "ltr" : undefined}
          inputMode={type === "tel" ? "tel" : undefined}
          placeholder={type === "tel" ? "09xxxxxxxxx" : undefined}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn("h-11 rounded-xl px-3.5 text-start placeholder:text-start", isPassword && "pe-11")}
          {...register(name)}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            aria-pressed={visible}
            className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOffIcon className="size-4" aria-hidden="true" /> : <EyeIcon className="size-4" aria-hidden="true" />}
          </button>
        ) : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {t(`errors.${toAuthErrorKey(error)}`)}
        </p>
      ) : null}
    </div>
  );
}

/** Navigates on after a successful sign-in; `done` keeps the button busy meanwhile. */
function useAfterAuth(callbackUrl: string) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  return {
    done,
    finish: () => {
      setDone(true);
      // Full server re-render so the header and protected pages see the session.
      router.replace(callbackUrl);
      router.refresh();
    },
  };
}

function FormError({ error }: { error: string | null }) {
  const t = useTranslations("auth");
  return error ? (
    <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {t(`errors.${toAuthErrorKey(error)}`)}
    </p>
  ) : null;
}

function handleResult<T extends FieldValues>(
  result: AuthResult,
  fields: readonly Path<T>[],
  setError: (name: Path<T>, error: { message: string }) => void,
  setFormError: (error: string | null) => void,
): boolean {
  if (result.ok) return true;
  const field = fields.find((name) => name === result.field);
  if (field) setError(field, { message: result.error });
  else setFormError(result.error);
  return false;
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations("auth");
  const { done, finish } = useAfterAuth(callbackUrl);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        const result = await login(values).catch((): AuthResult => ({ ok: false, error: "server" }));
        if (handleResult<LoginInput>(result, ["phone", "password"], setError, setFormError)) finish();
      })}
    >
      <FormError error={formError} />
      <Field<LoginInput> name="phone" type="tel" label={t("phone")} autoComplete="tel" register={register} error={errors.phone?.message} />
      <Field<LoginInput> name="password" type="password" label={t("password")} autoComplete="current-password" register={register} error={errors.password?.message} />
      <Button type="submit" size="lg" disabled={isSubmitting || done} className="h-12 w-full rounded-full text-base">
        {isSubmitting || done ? t("signingIn") : t("signIn")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href={{ pathname: "/register", query: { callbackUrl } }} className="touch-target font-medium text-primary hover:underline">
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { done, finish } = useAfterAuth(callbackUrl);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phone: "", password: "", confirmPassword: "" },
  });

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        const result = await registerUser(values, locale).catch(
          (): AuthResult => ({ ok: false, error: "server" }),
        );
        const fields = ["name", "phone", "password", "confirmPassword"] as const;
        if (handleResult<RegisterInput>(result, fields, setError, setFormError)) finish();
      })}
    >
      <FormError error={formError} />
      <Field<RegisterInput> name="name" label={t("name")} autoComplete="name" register={register} error={errors.name?.message} />
      <Field<RegisterInput> name="phone" type="tel" label={t("phone")} autoComplete="tel" register={register} error={errors.phone?.message} />
      <Field<RegisterInput> name="password" type="password" label={t("password")} autoComplete="new-password" hint={t("passwordHint")} register={register} error={errors.password?.message} />
      <Field<RegisterInput> name="confirmPassword" type="password" label={t("confirmPassword")} autoComplete="new-password" register={register} error={errors.confirmPassword?.message} />
      <Button type="submit" size="lg" disabled={isSubmitting || done} className="h-12 w-full rounded-full text-base">
        {isSubmitting || done ? t("creatingAccount") : t("createAccount")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href={{ pathname: "/login", query: { callbackUrl } }} className="touch-target font-medium text-primary hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
