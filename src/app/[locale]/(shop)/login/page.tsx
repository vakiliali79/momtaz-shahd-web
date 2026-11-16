import type { Metadata } from "next";
import { Suspense } from "react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { AuthCard, AuthFormSkeleton } from "@/components/auth/auth-page";
import { LoginForm } from "@/components/auth/auth-forms";
import { routing, type AppLocale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { getSessionUser } from "@/lib/session";
import { safeCallbackUrl } from "@/lib/validation/auth";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("auth.login");
  return {
    ...pageMetadata({ locale, path: "/login", title: t("title"), description: t("description") }),
    robots: { index: false, follow: true },
  };
}

/** Reads the session and the callbackUrl, so it renders inside <Suspense>. */
async function LoginGate({
  locale,
  searchParams,
}: {
  locale: AppLocale;
  searchParams: PageProps<"/[locale]/login">["searchParams"];
}) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl, `/${locale}`);
  // Already signed in: go straight to where the visitor was heading.
  if (await getSessionUser()) redirect(callbackUrl);
  return <LoginForm callbackUrl={callbackUrl} />;
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("auth.login");

  return (
    <AuthCard title={t("title")} description={t("description")}>
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginGate locale={locale} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
