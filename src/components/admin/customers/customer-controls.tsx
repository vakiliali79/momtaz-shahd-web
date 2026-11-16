"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setCustomerBlocked, setCustomerRole } from "@/actions/admin/customers";
import { AdminCard } from "@/components/admin/admin-ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roles = ["CUSTOMER", "WHOLESALE"] as const;

export function CustomerControls({
  id,
  role,
  isBlocked,
}: {
  id: string;
  role: "CUSTOMER" | "WHOLESALE";
  isBlocked: boolean;
}) {
  const t = useTranslations("admin.customers");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <AdminCard title={t("detail.manage")}>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="customer-role">{t("columns.role")}</Label>
          <Select
            value={role}
            disabled={pending}
            onValueChange={(value) => {
              const next = roles.find((entry) => entry === value);
              if (!next || next === role) return;
              startTransition(async () => {
                const result = await setCustomerRole(id, next);
                if (result.ok) {
                  toast.success(t("detail.roleChanged", { role: t(`roles.${next}`) }));
                  router.refresh();
                } else toast.error(tErrors(result.error));
              });
            }}
          >
            <SelectTrigger id="customer-role" className="h-10! w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((value) => (
                <SelectItem key={value} value={value}>{t(`roles.${value}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("detail.roleHint")}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{isBlocked ? t("detail.blockedText") : t("detail.blockHint")}</p>
          <ConfirmButton
            trigger={
              <Button variant={isBlocked ? "outline" : "destructive"} className="w-full rounded-full">
                {isBlocked ? t("detail.unblock") : t("detail.block")}
              </Button>
            }
            title={isBlocked ? t("detail.unblockTitle") : t("detail.blockTitle")}
            description={isBlocked ? t("detail.unblockText") : t("detail.blockText")}
            confirmLabel={isBlocked ? t("detail.unblock") : t("detail.block")}
            destructive={!isBlocked}
            onConfirm={async () => {
              const result = await setCustomerBlocked(id, !isBlocked);
              if (result.ok) {
                toast.success(isBlocked ? t("detail.unblocked") : t("detail.blocked"));
                router.refresh();
              } else toast.error(tErrors(result.error));
            }}
          />
        </div>
      </div>
    </AdminCard>
  );
}
