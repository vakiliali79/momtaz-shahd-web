"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteDealer, setDealerFlag } from "@/actions/admin/dealers";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function DealerFlagSwitch({
  id,
  field,
  value,
  label,
}: {
  id: string;
  field: "isActive" | "isVerified";
  value: boolean;
  label: string;
}) {
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const [checked, setChecked] = useState(value);
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={checked}
      disabled={pending}
      aria-label={label}
      onCheckedChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          const result = await setDealerFlag(id, field, next);
          if (!result.ok) {
            setChecked(!next);
            toast.error(tErrors(result.error));
          } else router.refresh();
        });
      }}
    />
  );
}

export function DeleteDealerButton({ id, name }: { id: string; name: string }) {
  const t = useTranslations("admin.dealers");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  return (
    <ConfirmButton
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={t("deleteFor", { name })}>
          <Trash2Icon className="text-destructive" aria-hidden="true" />
        </Button>
      }
      title={t("deleteTitle")}
      description={t("deleteText", { name })}
      confirmLabel={t("delete")}
      destructive
      onConfirm={async () => {
        const result = await deleteDealer(id);
        if (result.ok) {
          toast.success(t("deleted"));
          router.refresh();
        } else toast.error(tErrors(result.error));
      }}
    />
  );
}
