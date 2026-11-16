"use client";

import { useState, useTransition } from "react";
import { MapPinIcon, PencilIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { deleteAddress, setDefaultAddress, type AddressActionResult } from "@/actions/address";
import { AccountEmpty } from "@/components/account/account-ui";
import { AddressForm } from "@/components/checkout/address-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCity, getProvince } from "@/lib/locations";
import type { AddressDto } from "@/lib/orders/types";

export function AddressBook({
  initialAddresses,
  defaults,
}: {
  initialAddresses: AddressDto[];
  defaults: { receiverName: string; receiverPhone: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<AddressDto | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<AddressActionResult>, onOk: () => void, message: string) {
    startTransition(async () => {
      const result = await action().catch((): AddressActionResult => ({ ok: false, error: "server" }));
      if (result.ok) {
        onOk();
        toast.success(message);
      } else {
        toast.error(t(`address.errors.${result.error}`));
      }
    });
  }

  function makeDefault(id: string) {
    run(
      () => setDefaultAddress(id),
      () => setAddresses((list) => list.map((entry) => ({ ...entry, isDefault: entry.id === id }))),
      t("accountPages.addresses.defaultSet"),
    );
  }

  function confirmDelete() {
    const target = deleting;
    if (!target) return;
    run(
      () => deleteAddress(target.id),
      () => {
        setDeleting(null);
        setAddresses((list) => {
          const rest = list.filter((entry) => entry.id !== target.id);
          // Mirror the server: the oldest remaining address becomes the default.
          if (target.isDefault && rest.length > 0 && !rest.some((entry) => entry.isDefault)) {
            const oldest = [...rest].sort((a, b) => a.id.localeCompare(b.id))[0];
            return rest.map((entry) => ({ ...entry, isDefault: entry.id === oldest?.id }));
          }
          return rest;
        });
      },
      t("accountPages.addresses.deleted"),
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 && editing !== "new" ? (
        <AccountEmpty
          icon={<MapPinIcon className="size-7" strokeWidth={1.5} aria-hidden="true" />}
          title={t("accountPages.addresses.emptyTitle")}
          text={t("accountPages.addresses.emptyText")}
        />
      ) : null}

      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) =>
          editing === address.id ? (
            <li key={address.id} className="rounded-2xl border border-border bg-card p-4 sm:p-6 md:col-span-2">
              <h2 className="mb-4 font-semibold">{t("address.editTitle")}</h2>
              <AddressForm
                defaults={defaults}
                initial={address}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                  setAddresses((list) => list.map((entry) => (entry.id === saved.id ? saved : entry)));
                  setEditing(null);
                  toast.success(t("address.saved"));
                }}
              />
            </li>
          ) : (
            <li key={address.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-semibold">{address.title}</h2>
                {address.isDefault ? (
                  <span className="rounded-full bg-brand-leaf/15 px-2.5 py-0.5 text-xs font-semibold text-leaf-ink">
                    {t("accountPages.addresses.default")}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("address.place", {
                  province: getProvince(address.province)?.name[locale] ?? "",
                  city: getCity(address.province, address.city)?.name[locale] ?? "",
                })}{" "}
                — {address.fullAddress}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("address.receiverLine", { name: address.receiverName })} <span dir="ltr">{address.receiverPhone}</span>
                <span aria-hidden="true"> · </span>
                {t("address.postalCodeLine")} <span dir="ltr">{address.postalCode}</span>
              </p>
              {address.lat !== null ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPinIcon className="size-3" aria-hidden="true" />
                  {t("address.pinSaved")}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setEditing(address.id)}
                  aria-label={t("accountPages.addresses.editFor", { title: address.title })}
                >
                  <PencilIcon aria-hidden="true" />
                  {t("accountPages.addresses.edit")}
                </Button>
                {!address.isDefault ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    disabled={pending}
                    onClick={() => makeDefault(address.id)}
                    aria-label={t("accountPages.addresses.makeDefaultFor", { title: address.title })}
                  >
                    <StarIcon aria-hidden="true" />
                    {t("accountPages.addresses.makeDefault")}
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ms-auto rounded-full text-destructive hover:text-destructive"
                  onClick={() => setDeleting(address)}
                  aria-label={t("accountPages.addresses.deleteFor", { title: address.title })}
                >
                  <Trash2Icon aria-hidden="true" />
                  {t("accountPages.addresses.delete")}
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {editing === "new" ? (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 font-semibold">{t("address.formTitle")}</h2>
          <AddressForm
            defaults={defaults}
            onCancel={() => setEditing(null)}
            onSaved={(saved) => {
              setAddresses((list) => [...list, saved]);
              setEditing(null);
              toast.success(t("address.saved"));
            }}
          />
        </div>
      ) : editing === null ? (
        <Button variant="outline" size="lg" className="h-11 rounded-full px-5" onClick={() => setEditing("new")}>
          <PlusIcon aria-hidden="true" />
          {t("address.addNew")}
        </Button>
      ) : null}

      <Dialog open={deleting !== null} onOpenChange={(open) => (open ? null : setDeleting(null))}>
        <DialogContent closeLabel={t("common.close")} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("accountPages.addresses.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("accountPages.addresses.deleteText", { title: deleting?.title ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setDeleting(null)} disabled={pending}>
              {t("address.cancel")}
            </Button>
            <Button variant="destructive" className="rounded-full" onClick={confirmDelete} disabled={pending}>
              {t("accountPages.addresses.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
