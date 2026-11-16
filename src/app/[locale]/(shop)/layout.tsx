import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { formatDate } from "@/lib/format";
import { currentLocale } from "@/lib/locale";

// Footer copyright year. Fixed at build time; bump on the yearly release.
const COPYRIGHT_DATE = "2026-11-16T12:00:00Z";

/** The storefront chrome: site header, main content and footer. */
export default async function ShopLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await currentLocale();
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer year={formatDate(COPYRIGHT_DATE, locale, { year: "numeric" })} />
    </>
  );
}
