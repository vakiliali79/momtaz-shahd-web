import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { clientMessages } from "@/i18n/client-messages";
import { currentLocale } from "@/lib/locale";
import { requireAdmin } from "@/lib/session";

// Per-admin pages: nothing to prerender.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.shell");
  return {
    title: { default: t("title"), template: `%s | ${t("title")}` },
    robots: { index: false, follow: false },
  };
}

/**
 * Checks the ADMIN role on the server before rendering anything. Each page,
 * server action and admin route handler checks again on its own, because a
 * layout does not protect requests that skip it.
 */
async function AdminGate({ children }: { children: ReactNode }) {
  const locale = await currentLocale();
  const admin = await requireAdmin(locale, "/admin");
  // The admin panel's own texts are only sent to the browser here.
  return (
    <NextIntlClientProvider messages={clientMessages(await getMessages(), { includeAdmin: true })}>
      <AdminShell adminName={admin.name ?? admin.phone}>{children}</AdminShell>
    </NextIntlClientProvider>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh">
          <Skeleton className="hidden h-dvh w-60 rounded-none lg:block" />
          <div className="flex-1 space-y-4 p-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
