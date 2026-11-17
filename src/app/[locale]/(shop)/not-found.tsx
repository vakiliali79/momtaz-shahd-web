import { useLocale, useTranslations } from "next-intl";

import { SearchForm } from "@/components/layout/search-form";
import { StatusPage } from "@/components/shared/status-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";

const popular = [
  { key: "products", href: "/products" },
  { key: "wholesale", href: "/wholesale" },
  { key: "dealers", href: "/dealers" },
  { key: "contact", href: "/contact" },
] as const;

/** Branded 404 inside the shop layout (header and footer stay visible). */
export default function NotFound() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <StatusPage
      variant="notFound"
      code={formatNumber(404, locale).replace(/[٬,]/g, "")}
      title={t("notFound.title")}
      description={t("notFound.description")}
      actions={
        <>
          <Button asChild size="lg" className="h-12 rounded-full px-6">
            <Link href="/">{t("notFound.backHome")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
            <Link href="/products">{t("notFound.browse")}</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <SearchForm className="mx-auto max-w-sm" landmarkLabel={t("notFound.search")} />
        <nav aria-label={t("notFound.popular")}>
          <p className="mb-3 text-sm text-muted-foreground">{t("notFound.popular")}</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {popular.map(({ key, href }) => (
              <li key={key}>
                <Link href={href} className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-brand-gold hover:text-primary">
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </StatusPage>
  );
}
