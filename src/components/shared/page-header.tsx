import { Fragment, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/shared/json-ld";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  const t = useTranslations("breadcrumbs");
  const locale = useLocale();
  const absolute = (href: string) => `${SITE_URL}/${locale}${href === "/" ? "" : href}`;
  // The same trail as structured data, for search result breadcrumbs.
  const trail = [{ label: t("home"), href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absolute(item.href) } : {}),
    })),
  };

  return (
    <>
    <JsonLd data={jsonLd} />
    <Breadcrumb aria-label={t("label")}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">{t("home")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item) => (
          <Fragment key={`${item.href ?? ""}-${item.label}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
    </>
  );
}

export function PageHeader({
  title,
  description,
  crumbs,
  children,
}: {
  title: string;
  description?: string;
  crumbs: readonly Crumb[];
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-linear-to-b from-secondary/60 to-background dark:from-secondary/30">
      <Container className="space-y-4 page-y">
        <Breadcrumbs items={crumbs} />
        <div className="space-y-2">
          <h1 className="text-fluid-2xl font-bold text-balance">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-fluid-sm leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </Container>
    </div>
  );
}
