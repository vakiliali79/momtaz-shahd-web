"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteCategory } from "@/actions/admin/categories";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";

export function DeleteCategoryButton({ id, name, disabled }: { id: string; name: string; disabled: boolean }) {
  const t = useTranslations("admin.categories");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  return (
    <ConfirmButton
      trigger={
        <Button variant="ghost" size="icon-lg" disabled={disabled} aria-label={t("deleteFor", { name })} title={disabled ? t("deleteDisabled") : undefined}>
          <Trash2Icon className="text-destructive" aria-hidden="true" />
        </Button>
      }
      title={t("deleteTitle")}
      description={t("deleteText", { name })}
      confirmLabel={t("delete")}
      destructive
      onConfirm={async () => {
        const result = await deleteCategory(id);
        if (result.ok) {
          toast.success(t("deleted"));
          router.refresh();
        } else toast.error(tErrors(result.error));
      }}
    />
  );
}
