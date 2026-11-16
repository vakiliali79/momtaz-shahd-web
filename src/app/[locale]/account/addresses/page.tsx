import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AddressBook } from "@/components/account/address-book";
import { AccountHeading, AccountPageSkeleton } from "@/components/account/account-ui";
import { listAddresses } from "@/lib/account/queries";
import { currentLocale } from "@/lib/locale";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountPages.addresses");
  return { title: t("title") };
}

async function Addresses() {
  const locale = await currentLocale();
  const user = await requireUser(locale, "/account/addresses");
  const [t, addresses] = await Promise.all([getTranslations("accountPages.addresses"), listAddresses(user.id)]);
  return (
    <>
      <AccountHeading title={t("title")} description={t("description")} />
      <AddressBook
        initialAddresses={addresses}
        defaults={{ receiverName: user.name ?? "", receiverPhone: user.phone }}
      />
    </>
  );
}

export default function AddressesPage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Addresses />
    </Suspense>
  );
}
