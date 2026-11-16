"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateWholesaleRequest } from "@/actions/admin/wholesale";
import { AdminCard } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { wholesaleStatuses, type WholesaleStatus } from "@/lib/admin/wholesale-statuses";

export function WholesaleForm({ id, status, adminNote }: { id: string; status: WholesaleStatus; adminNote: string | null }) {
  const t = useTranslations("admin.wholesale");
  const tErrors = useTranslations("admin.errors");
  const router = useRouter();
  const [value, setValue] = useState<WholesaleStatus>(status);
  const [note, setNote] = useState(adminNote ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <AdminCard title={t("detail.workflow")}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updateWholesaleRequest({ id, status: value, adminNote: note });
            if (result.ok) {
              toast.success(t("detail.saved"));
              router.refresh();
            } else toast.error(tErrors(result.error));
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="wholesale-status">{t("columns.status")}</Label>
          <Select value={value} onValueChange={(next) => setValue(wholesaleStatuses.find((s) => s === next) ?? value)}>
            <SelectTrigger id="wholesale-status" className="h-10! w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {wholesaleStatuses.map((entry) => (
                <SelectItem key={entry} value={entry}>{t(`statuses.${entry}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wholesale-note">{t("detail.note")}</Label>
          <Textarea id="wholesale-note" rows={5} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} className="rounded-xl" />
          <p className="text-xs text-muted-foreground">{t("detail.noteHint")}</p>
        </div>
        <Button type="submit" disabled={pending} className="w-full rounded-full">{pending ? t("detail.saving") : t("detail.save")}</Button>
      </form>
    </AdminCard>
  );
}
