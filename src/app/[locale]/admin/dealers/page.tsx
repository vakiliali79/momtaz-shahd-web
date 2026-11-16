import type { Metadata } from "next";
import { Suspense } from "react";
import { MapPinIcon, PencilIcon, PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton, Pill } from "@/components/admin/admin-ui";
import { DealerFlagSwitch, DeleteDealerButton } from "@/components/admin/dealers/dealer-row-actions";
import { ProductImage } from "@/components/product/product-image";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listAdminDealers } from "@/lib/admin/dealers";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dealers");
  return { title: t("title") };
}

async function Dealers() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/dealers");
  const [t, dealers] = await Promise.all([getTranslations("admin.dealers"), listAdminDealers(locale)]);

  return (
    <>
      <AdminHeading
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/dealers/new"><PlusIcon aria-hidden="true" />{t("new")}</Link>
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[44rem] text-sm">
          <caption className="sr-only">{t("title")}</caption>
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.name")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.type")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.place")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.phone")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.verified")}</th>
              <th scope="col" className="p-3 text-start font-medium">{t("columns.active")}</th>
              <th scope="col" className="p-3"><span className="sr-only">{t("columns.actions")}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dealers.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">{t("empty")}</td></tr>
            ) : (
              dealers.map((dealer) => (
                <tr key={dealer.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <ProductImage src={dealer.image} alt="" sizes="40px" />
                      </span>
                      <Link href={`/admin/dealers/${dealer.id}`} className="font-medium hover:text-primary">{dealer.name}</Link>
                    </div>
                  </td>
                  <td className="p-3"><Pill tone={dealer.type === "AGENCY" ? "gold" : dealer.type === "DISTRIBUTOR" ? "blue" : "muted"}>{t(`types.${dealer.type}`)}</Pill></td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1">
                      {t("place", dealer.place)}
                      {dealer.hasLocation ? <MapPinIcon className="size-3.5 text-brand-leaf" aria-label={t("hasPin")} /> : null}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap" dir="ltr"><span className="block text-start">{dealer.phone ?? "—"}</span></td>
                  <td className="p-3"><DealerFlagSwitch id={dealer.id} field="isVerified" value={dealer.isVerified} label={t("verifiedFor", { name: dealer.name })} /></td>
                  <td className="p-3"><DealerFlagSwitch id={dealer.id} field="isActive" value={dealer.isActive} label={t("activeFor", { name: dealer.name })} /></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm" aria-label={t("editFor", { name: dealer.name })}>
                        <Link href={`/admin/dealers/${dealer.id}`}><PencilIcon aria-hidden="true" /></Link>
                      </Button>
                      <DeleteDealerButton id={dealer.id} name={dealer.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function DealersPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Dealers />
    </Suspense>
  );
}
