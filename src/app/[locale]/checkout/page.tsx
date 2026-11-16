import type { Metadata } from "next";
import { Suspense } from "react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { routing, type AppLocale } from "@/i18n/routing";
import { getShippingConfig } from "@/lib/data/settings";
import { db } from "@/lib/db";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** Reads the session, so it streams in behind <Suspense>. */
async function CheckoutLoader({ locale }: { locale: AppLocale }) {
  const user = await requireUser(locale, "/checkout");
  const [addresses, shipping] = await Promise.all([
    db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      select: {
        id: true,
        title: true,
        province: true,
        city: true,
        fullAddress: true,
        postalCode: true,
        receiverName: true,
        receiverPhone: true,
        lat: true,
        lng: true,
        isDefault: true,
      },
    }),
    getShippingConfig(),
  ]);

  return (
    <CheckoutFlow
      user={{ name: user.name ?? "", phone: user.phone, isWholesale: user.role === "WHOLESALE" }}
      initialAddresses={addresses}
      shipping={shipping}
      onlinePayment={isOnlinePaymentEnabled()}
    />
  );
}

export default async function CheckoutPage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations();

  return (
    <>
      <PageHeader
        title={t("checkout.title")}
        crumbs={[{ label: t("cart.title"), href: "/cart" }, { label: t("checkout.title") }]}
      />
      <Suspense
        fallback={
          <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              <Skeleton className="h-10 rounded-full" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
            <Skeleton className="hidden h-96 rounded-2xl lg:block" />
          </Container>
        }
      >
        <CheckoutLoader locale={locale} />
      </Suspense>
    </>
  );
}
