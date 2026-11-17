import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Providers } from "@/components/providers";
import { getDirection } from "@/i18n/locales";
import { routing, type AppLocale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

import "../globals.css";

// One font per locale. All three expose the same CSS variable, and only the
// active locale's class is put on <html>, so only that font is downloaded.
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-locale",
  display: "swap",
  preload: false,
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-locale",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-locale",
  display: "swap",
  preload: false,
});

const fontClass: Record<AppLocale, string> = {
  fa: vazirmatn.variable,
  ar: plexArabic.variable,
  en: inter.variable,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    metadataBase: new URL(SITE_URL),
    openGraph: { siteName: t("siteName"), type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#17110c" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${fontClass[locale]} h-full antialiased`}
      // next-themes sets the theme class on <html> before hydration.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {/* Without JavaScript the entrance animations never run: show content. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <NextIntlClientProvider>
          {/* Shop pages add the site header and footer in (shop)/layout.tsx; the admin has its own. */}
          <Providers dir={dir}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
