"use client";

import { useState, useTransition } from "react";
import { XCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelMyOrder, type CancelOrderResult } from "@/actions/account-orders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await cancelMyOrder(orderNumber).catch(
        (): CancelOrderResult => ({ ok: false, error: "server" }),
      );
      if (result.ok) {
        setOpen(false);
        toast.success(t("accountPages.orderDetail.cancelled"));
        router.refresh();
      } else {
        toast.error(t(`accountPages.orderDetail.cancelErrors.${result.error}`));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="h-10 rounded-full px-4 text-destructive hover:text-destructive">
          <XCircleIcon aria-hidden="true" />
          {t("accountPages.orderDetail.cancel")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("common.close")} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("accountPages.orderDetail.cancelTitle")}</DialogTitle>
          <DialogDescription>{t("accountPages.orderDetail.cancelText", { number: orderNumber })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending} className="rounded-full">
            {t("accountPages.orderDetail.keepOrder")}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending} className="rounded-full">
            {pending ? t("accountPages.orderDetail.cancelling") : t("accountPages.orderDetail.confirmCancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
