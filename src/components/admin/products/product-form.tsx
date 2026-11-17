"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Controller, useForm, type FieldError, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { saveProduct } from "@/actions/admin/products";
import { AdminCard } from "@/components/admin/admin-ui";
import { NumberField, SelectField, SwitchField, TextField } from "@/components/admin/form-fields";
import { ImageUploader } from "@/components/admin/image-uploader";
import { LocalizedTabs } from "@/components/admin/localized-tabs";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { productSchema, type ProductInput, type ProductOutput } from "@/lib/admin/product-schema";
import { emptyLocalized } from "@/lib/admin/validation";

export function ProductForm({
  productId,
  initial,
  categories,
}: {
  productId: string | null;
  initial?: ProductInput;
  categories: { id: string; label: string }[];
}) {
  const t = useTranslations("admin.products.form");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const locale = useLocale();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput, unknown, ProductOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: initial ?? {
      slug: "",
      categoryId: categories[0]?.id ?? "",
      name: emptyLocalized(),
      description: emptyLocalized(),
      ingredients: emptyLocalized(),
      price: Number.NaN,
      discountPrice: null,
      wholesalePrice: null,
      minWholesaleQty: null,
      weightGrams: Number.NaN,
      stock: 0,
      shelfLifeDays: null,
      images: [],
      isActive: true,
      isFeatured: false,
    },
  });

  const localeHasError = (code: AppLocale) =>
    Boolean(errors.name?.[code] || errors.description?.[code] || errors.ingredients?.[code]);

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const result = await saveProduct(productId, values).catch(() => ({ ok: false as const, error: "server" as const, field: undefined }));
        if (result.ok) {
          toast.success(t("saved"));
          if (!productId) router.replace(`/${locale}/admin/products/${result.data.id}`);
          else router.refresh();
        } else if (result.field) {
          setError(result.field as FieldPath<ProductInput>, { message: result.error });
          toast.error(tErrors(result.error));
        } else {
          toast.error(tErrors(result.error));
        }
      })}
    >
      <AdminCard title={t("texts")}>
        <LocalizedTabs
          hasError={localeHasError}
          render={(code) => (
            <>
              <TextField<ProductInput> name={`name.${code}`} label={t("name")} register={register} error={errors.name?.[code]} />
              <TextField<ProductInput> name={`description.${code}`} label={t("description")} register={register} error={errors.description?.[code]} multiline rows={5} />
              <TextField<ProductInput> name={`ingredients.${code}`} label={t("ingredients")} register={register} error={errors.ingredients?.[code]} multiline rows={3} />
            </>
          )}
        />
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title={t("general")}>
          <div className="space-y-4">
            <TextField<ProductInput> name="slug" label={t("slug")} hint={t("slugHint")} dir="ltr" register={register} error={errors.slug} />
            <SelectField<ProductInput> name="categoryId" label={t("category")} control={control} options={categories.map((c) => ({ value: c.id, label: c.label }))} error={errors.categoryId} />
            <SwitchField<ProductInput> name="isActive" label={t("isActive")} hint={t("isActiveHint")} control={control} />
            <SwitchField<ProductInput> name="isFeatured" label={t("isFeatured")} hint={t("isFeaturedHint")} control={control} />
          </div>
        </AdminCard>

        <AdminCard title={t("pricing")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField<ProductInput> name="price" label={t("price")} register={register} error={errors.price} />
            <NumberField<ProductInput> name="discountPrice" label={t("discountPrice")} hint={t("optional")} register={register} error={errors.discountPrice} nullable />
            <NumberField<ProductInput> name="wholesalePrice" label={t("wholesalePrice")} hint={t("optional")} register={register} error={errors.wholesalePrice} nullable />
            <NumberField<ProductInput> name="minWholesaleQty" label={t("minWholesaleQty")} hint={t("optional")} register={register} error={errors.minWholesaleQty} nullable />
          </div>
        </AdminCard>

        <AdminCard title={t("inventory")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField<ProductInput> name="stock" label={t("stock")} register={register} error={errors.stock} />
            <NumberField<ProductInput> name="weightGrams" label={t("weightGrams")} register={register} error={errors.weightGrams} />
            <NumberField<ProductInput> name="shelfLifeDays" label={t("shelfLifeDays")} hint={t("optional")} register={register} error={errors.shelfLifeDays} nullable />
          </div>
        </AdminCard>

        <AdminCard title={t("images")} className="lg:col-span-2">
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} folder="products" label={t("images")} />
            )}
          />
          {errors.images ? <p role="alert" className="mt-2 text-xs text-destructive">{tErrors("tooLong")}</p> : null}
        </AdminCard>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-8">
          {isSubmitting ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

export type { FieldError };
