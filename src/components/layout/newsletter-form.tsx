"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { subscribeToNewsletter } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  newsletterSchema,
  toNewsletterErrorKey,
  type NewsletterInput,
} from "@/lib/validation/newsletter";

export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const id = useId();
  const errorId = `${id}-error`;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: NewsletterInput) {
    try {
      const result = await subscribeToNewsletter(values);
      if (result.ok) {
        reset();
        toast.success(t("success"));
      } else {
        setError("email", { message: result.error });
      }
    } catch {
      toast.error(t("errors.server"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
      <label htmlFor={id} className="sr-only">
        {t("emailLabel")}
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={id}
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? errorId : undefined}
          className="h-10 min-w-0 flex-1 basis-44 rounded-full bg-background px-4 text-start placeholder:text-start"
          {...register("email")}
        />
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-10 rounded-full px-5"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </div>
      {errors.email ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {t(`errors.${toNewsletterErrorKey(errors.email.message)}`)}
        </p>
      ) : null}
    </form>
  );
}
