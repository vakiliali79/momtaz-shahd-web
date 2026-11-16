"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { uploadTransferReceipt, type ReceiptResult } from "@/actions/receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RECEIPT_TYPES,
  receiptSchema,
  toReceiptErrorKey,
  type ReceiptInput,
} from "@/lib/validation/receipt";

export function ReceiptUpload({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations("receipt");
  const router = useRouter();
  const id = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptInput>({
    resolver: zodResolver(receiptSchema),
    defaultValues: { orderNumber, reference: "" },
  });

  async function onSubmit(values: ReceiptInput) {
    setFormError(null);
    const formData = new FormData();
    formData.set("orderNumber", values.orderNumber);
    formData.set("reference", values.reference);
    formData.set("file", values.file);
    const result = await uploadTransferReceipt(formData).catch(
      (): ReceiptResult => ({ ok: false, error: "server" }),
    );
    if (result.ok) {
      reset({ orderNumber, reference: "" });
      toast.success(t("uploaded"));
      router.refresh();
    } else {
      setFormError(result.error);
    }
  }

  const fileError = errors.file?.message ?? formError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${id}-file`}>{t("file")}</Label>
        <Controller
          control={control}
          name="file"
          render={({ field }) => (
            <Input
              id={`${id}-file`}
              type="file"
              accept={RECEIPT_TYPES.join(",")}
              aria-invalid={fileError ? true : undefined}
              aria-describedby={`${id}-file-hint${fileError ? ` ${id}-file-error` : ""}`}
              className="h-auto rounded-xl px-3 py-2 file:me-3 file:rounded-full file:bg-secondary file:px-3 file:py-1"
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.files?.[0])}
            />
          )}
        />
        <p id={`${id}-file-hint`} className="text-xs text-muted-foreground">
          {t("fileHint")}
        </p>
        {fileError ? (
          <p id={`${id}-file-error`} role="alert" className="text-sm text-destructive">
            {t(`errors.${toReceiptErrorKey(fileError)}`)}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-reference`}>{t("reference")}</Label>
        <Input
          id={`${id}-reference`}
          dir="ltr"
          maxLength={40}
          className="h-11 rounded-xl px-3.5 text-start"
          aria-invalid={errors.reference ? true : undefined}
          {...register("reference")}
        />
        {errors.reference ? (
          <p role="alert" className="text-sm text-destructive">
            {t(`errors.${toReceiptErrorKey(errors.reference.message)}`)}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-6">
        <UploadIcon aria-hidden="true" />
        {isSubmitting ? t("uploading") : t("submit")}
      </Button>
    </form>
  );
}
