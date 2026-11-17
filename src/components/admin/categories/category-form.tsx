"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { saveCategory } from "@/actions/admin/categories";
import { AdminCard } from "@/components/admin/admin-ui";
import { NumberField, TextField } from "@/components/admin/form-fields";
import { ImageUploader } from "@/components/admin/image-uploader";
import { LocalizedTabs } from "@/components/admin/localized-tabs";
import { Button } from "@/components/ui/button";
import { categorySchema, type CategoryInput, type CategoryOutput } from "@/lib/admin/category-schema";
import { emptyLocalized } from "@/lib/admin/validation";

export function CategoryForm({ categoryId, initial }: { categoryId: string | null; initial?: CategoryInput }) {
  const t = useTranslations("admin.categories.form");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const locale = useLocale();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput, unknown, CategoryOutput>({
    resolver: zodResolver(categorySchema),
    defaultValues: initial ?? { slug: "", name: emptyLocalized(), description: emptyLocalized(), images: [], sortOrder: 0 },
  });

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const result = await saveCategory(categoryId, values).catch(() => ({ ok: false as const, error: "server" as const, field: undefined }));
        if (result.ok) {
          toast.success(t("saved"));
          router.push(`/${locale}/admin/categories`);
        } else {
          if (result.field) setError(result.field as FieldPath<CategoryInput>, { message: result.error });
          toast.error(tErrors(result.error));
        }
      })}
    >
      <AdminCard title={t("texts")}>
        <LocalizedTabs
          hasError={(code) => Boolean(errors.name?.[code] || errors.description?.[code])}
          render={(code) => (
            <>
              <TextField<CategoryInput> name={`name.${code}`} label={t("name")} register={register} error={errors.name?.[code]} />
              <TextField<CategoryInput> name={`description.${code}`} label={t("description")} register={register} error={errors.description?.[code]} multiline rows={3} />
            </>
          )}
        />
      </AdminCard>
      <AdminCard title={t("general")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<CategoryInput> name="slug" label={t("slug")} hint={t("slugHint")} dir="ltr" register={register} error={errors.slug} />
          <NumberField<CategoryInput> name="sortOrder" label={t("sortOrder")} hint={t("sortOrderHint")} register={register} error={errors.sortOrder} />
        </div>
        <div className="mt-4">
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} folder="categories" max={1} label={t("image")} />
            )}
          />
        </div>
      </AdminCard>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-8">
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
