"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteCoupon, setCouponActive } from "@/actions/admin/coupons";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function CouponActiveSwitch({ id, code, active }: { id: string; code: string; active: boolean }) {
  const t = useTranslations("admin.coupons");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const [checked, setChecked] = useState(active);
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={checked}
      disabled={pending}
      aria-label={t("activeFor", { code })}
      onCheckedChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          const result = await setCouponActive(id, next);
          if (!result.ok) {
            setChecked(!next);
            toast.error(tErrors(result.error));
          } else router.refresh();
        });
      }}
    />
  );
}

export function DeleteCouponButton({ id, code }: { id: string; code: string }) {
  const t = useTranslations("admin.coupons");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  return (
    <ConfirmButton
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={t("deleteFor", { code })}>
          <Trash2Icon className="text-destructive" aria-hidden="true" />
        </Button>
      }
      title={t("deleteTitle")}
      description={t("deleteText", { code })}
      confirmLabel={t("delete")}
      destructive
      onConfirm={async () => {
        const result = await deleteCoupon(id);
        if (result.ok) {
          toast.success(t("deleted"));
          router.refresh();
        } else toast.error(tErrors(result.error));
      }}
    />
  );
}
