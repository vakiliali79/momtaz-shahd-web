"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  changeOrderStatus,
  confirmBankTransferAction,
  rejectTransferReceiptAction,
  setTrackingCode,
} from "@/actions/admin/orders";
import { AdminCard } from "@/components/admin/admin-ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatusId } from "@/lib/orders/status";

export function OrderStatusForm({ orderNumber, next }: { orderNumber: string; next: readonly OrderStatusId[] }) {
  const t = useTranslations("admin.orders.detail");
  const tStatus = useTranslations("order.status");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatusId | "">("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [pending, startTransition] = useTransition();

  if (next.length === 0) {
    return (
      <AdminCard title={t("statusTitle")}>
        <p className="text-sm text-muted-foreground">{t("finalStatus")}</p>
      </AdminCard>
    );
  }

  return (
    <AdminCard title={t("statusTitle")}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!status) return;
          startTransition(async () => {
            const result = await changeOrderStatus({ orderNumber, status, note, notify });
            if (result.ok) {
              toast.success(t("statusChanged", { status: tStatus(status) }));
              setStatus("");
              setNote("");
              router.refresh();
            } else toast.error(tErrors(result.error));
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="order-status">{t("newStatus")}</Label>
          <Select value={status} onValueChange={(value) => setStatus(next.find((s) => s === value) ?? "")}>
            <SelectTrigger id="order-status" className="h-11! w-full rounded-xl">
              <SelectValue placeholder={t("chooseStatus")} />
            </SelectTrigger>
            <SelectContent>
              {next.map((value) => (
                <SelectItem key={value} value={value}>{tStatus(value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {status === "CANCELLED" ? <p className="text-xs text-destructive">{t("cancelWarning")}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="order-note">{t("internalNote")}</Label>
          <Textarea id="order-note" rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="rounded-xl" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={notify} onCheckedChange={(checked) => setNotify(checked === true)} />
          {t("notifyCustomer")}
        </label>
        <Button type="submit" disabled={!status || pending} className="w-full rounded-full">
          {pending ? t("saving") : t("applyStatus")}
        </Button>
      </form>
    </AdminCard>
  );
}

export function TrackingCodeForm({ orderNumber, current }: { orderNumber: string; current: string | null }) {
  const t = useTranslations("admin.orders.detail");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const [code, setCode] = useState(current ?? "");
  const [notify, setNotify] = useState(true);
  const [pending, startTransition] = useTransition();

  return (
    <AdminCard title={t("trackingTitle")}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await setTrackingCode({ orderNumber, code, notify });
            if (result.ok) {
              toast.success(t("trackingSaved"));
              router.refresh();
            } else toast.error(tErrors(result.error));
          });
        }}
      >
        <Label htmlFor="tracking-code" className="sr-only">{t("trackingTitle")}</Label>
        <Input id="tracking-code" dir="ltr" value={code} maxLength={64} onChange={(event) => setCode(event.target.value)} placeholder="IR1234567890" className="h-11 rounded-xl text-start" />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={notify} onCheckedChange={(checked) => setNotify(checked === true)} />
          {t("notifyCustomer")}
        </label>
        <Button type="submit" variant="outline" disabled={pending || code.trim() === ""} className="w-full rounded-full">
          {t("saveTracking")}
        </Button>
      </form>
    </AdminCard>
  );
}

export function BankTransferPanel({ orderNumber, hasReceipt }: { orderNumber: string; hasReceipt: boolean }) {
  const t = useTranslations("admin.orders.detail");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();

  return (
    <AdminCard title={t("bankTitle")} className="border-brand-gold/40">
      <p className="mb-3 text-sm text-muted-foreground">{hasReceipt ? t("bankWithReceipt") : t("bankNoReceipt")}</p>
      <div className="flex flex-wrap gap-2">
        {hasReceipt ? (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <a href={`/api/orders/${orderNumber}/receipt`} target="_blank" rel="noopener">{t("viewReceipt")}</a>
          </Button>
        ) : null}
        <ConfirmButton
          trigger={<Button size="sm" className="rounded-full">{t("confirmTransfer")}</Button>}
          title={t("confirmTransferTitle")}
          description={t("confirmTransferText", { number: orderNumber })}
          confirmLabel={t("confirmTransfer")}
          onConfirm={async () => {
            const result = await confirmBankTransferAction(orderNumber);
            if (result.ok) {
              toast.success(t("transferConfirmed"));
              router.refresh();
            } else toast.error(tErrors(result.error));
          }}
        />
        {hasReceipt ? (
          <ConfirmButton
            trigger={<Button size="sm" variant="ghost" className="rounded-full text-destructive">{t("rejectReceipt")}</Button>}
            title={t("rejectReceiptTitle")}
            description={t("rejectReceiptText")}
            confirmLabel={t("rejectReceipt")}
            destructive
            onConfirm={async () => {
              const result = await rejectTransferReceiptAction(orderNumber);
              if (result.ok) {
                toast.success(t("receiptRejected"));
                router.refresh();
              } else toast.error(tErrors(result.error));
            }}
          />
        ) : null}
      </div>
    </AdminCard>
  );
}
