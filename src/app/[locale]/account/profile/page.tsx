import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AccountHeading, AccountPageSkeleton } from "@/components/account/account-ui";
import { PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { currentLocale } from "@/lib/locale";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountPages.profile");
  return { title: t("title") };
}

async function Profile() {
  const locale = await currentLocale();
  const user = await requireUser(locale, "/account/profile");
  const [t, record] = await Promise.all([
    getTranslations("accountPages.profile"),
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { preferredLocale: true, passwordHash: true },
    }),
  ]);
  const preferredLocale = routing.locales.find((code) => code === record.preferredLocale) ?? routing.defaultLocale;

  return (
    <>
      <AccountHeading title={t("title")} description={t("description")} />
      <div className="space-y-6">
        <section aria-labelledby="profile-details" className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <h2 id="profile-details" className="mb-5 text-lg font-semibold">{t("detailsTitle")}</h2>
          <ProfileForm
            phone={user.phone}
            initial={{ name: user.name ?? "", email: user.email ?? "", preferredLocale }}
          />
        </section>
        <section aria-labelledby="profile-password" className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <h2 id="profile-password" className="mb-5 text-lg font-semibold">{t("passwordTitle")}</h2>
          <PasswordForm hasPassword={record.passwordHash !== null} />
        </section>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <Profile />
    </Suspense>
  );
}
