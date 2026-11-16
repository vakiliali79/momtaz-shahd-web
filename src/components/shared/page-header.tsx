import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  const t = useTranslations("breadcrumbs");

  return (
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
      <Container className="space-y-4 py-6 sm:py-10">
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
