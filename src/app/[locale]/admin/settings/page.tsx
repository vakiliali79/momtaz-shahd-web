import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AdminHeading, AdminPageSkeleton } from "@/components/admin/admin-ui";
import { ShippingSettingsForm } from "@/components/admin/settings/shipping-settings-form";
import {
  AnnouncementSettingsForm,
  BankSettingsForm,
  ContactSettingsForm,
  CurrencySettingsForm,
} from "@/components/admin/settings/simple-settings-forms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminSettings } from "@/lib/admin/settings";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.settings");
  return { title: t("title") };
}

const sections = ["shipping", "currency", "contact", "announcement", "bank"] as const;

async function Settings() {
  const locale = await currentLocale();
  await requireAdmin(locale, "/admin/settings");
  const [t, settings] = await Promise.all([getTranslations("admin.settings"), getAdminSettings()]);

  return (
    <div className="mx-auto max-w-4xl">
      <AdminHeading title={t("title")} description={t("description")} />
      <Tabs defaultValue="shipping" className="gap-6">
        <div className="relative overflow-x-auto">
          <TabsList aria-label={t("title")}>
            {sections.map((section) => (
              <TabsTrigger key={section} value={section} className="px-3">{t(`tabs.${section}`)}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="shipping">
          <ShippingSettingsForm shipping={settings.shipping} freeShipping={settings.freeShipping} />
        </TabsContent>
        <TabsContent value="currency">
          <CurrencySettingsForm initial={settings.exchangeRates} />
        </TabsContent>
        <TabsContent value="contact">
          <ContactSettingsForm initial={settings.contact} />
        </TabsContent>
        <TabsContent value="announcement">
          <AnnouncementSettingsForm initial={settings.announcementBanner} />
        </TabsContent>
        <TabsContent value="bank">
          <BankSettingsForm initial={settings.bankTransfer} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <Settings />
    </Suspense>
  );
}
