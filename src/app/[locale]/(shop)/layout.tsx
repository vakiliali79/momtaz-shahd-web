import { ApproxRatesProvider } from "@/components/currency/approx-price";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/layout/skip-link";
import { getAnnouncement, getContactInfo, getExchangeRates } from "@/lib/data/settings";
import { formatDate } from "@/lib/format";
import { currentLocale } from "@/lib/locale";

// Footer copyright year. Fixed at build time; bump on the yearly release.
const COPYRIGHT_DATE = "2026-11-16T12:00:00Z";

/** The storefront chrome: announcement strip, site header, main content and footer. */
export default async function ShopLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await currentLocale();
  const [contact, announcement, exchange] = await Promise.all([getContactInfo(), getAnnouncement(), getExchangeRates()]);
  const bannerText = announcement?.text[locale];
  // Toman only for Persian; English and Arabic may also see approximate USD/AED.
  const rates = locale !== "fa" && exchange?.showApproximate ? exchange.rates : null;
  return (
    <ApproxRatesProvider rates={rates}>
      <SkipLink />
      {announcement && bannerText ? <AnnouncementBanner text={bannerText} link={announcement.link || null} /> : null}
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer year={formatDate(COPYRIGHT_DATE, locale, { year: "numeric" })} contact={contact} locale={locale} />
    </ApproxRatesProvider>
  );
}
