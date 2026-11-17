"use client";

import {
  BoxesIcon,
  HeartIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  PackageIcon,
  StarIcon,
  UserCogIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { key: "dashboard", href: "/account", Icon: LayoutDashboardIcon },
  { key: "orders", href: "/account/orders", Icon: PackageIcon },
  { key: "addresses", href: "/account/addresses", Icon: MapPinIcon },
  { key: "wishlist", href: "/account/wishlist", Icon: HeartIcon },
  { key: "reviews", href: "/account/reviews", Icon: StarIcon },
  { key: "profile", href: "/account/profile", Icon: UserCogIcon },
  { key: "wholesale", href: "/account/wholesale", Icon: BoxesIcon },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/account" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar on large screens, a bottom tab bar on phones and tablets. */
export function AccountNav({ name, isWholesale }: { name: string; isWholesale: boolean }) {
  const t = useTranslations("accountPages.nav");
  const pathname = usePathname();
  const visible = items.filter((item) => item.key !== "wholesale" || isWholesale);

  return (
    <>
      <div className="hidden print:hidden lg:block">
        <nav aria-label={t("label")} className="sticky top-24 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <p className="truncate px-3 pt-1 pb-3 text-sm text-muted-foreground">
            {t("greeting", { name })}
          </p>
          <ul className="space-y-1">
            {visible.map(({ key, href, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted",
                      active && "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <Icon className={cn("size-4.5", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <nav
        aria-label={t("tabsLabel")}
        data-account-tabs
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur print:hidden lg:hidden"
      >
        <ul className="flex relative overflow-x-auto px-1 pb-[env(safe-area-inset-bottom)]">
          {visible.map(({ key, href, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={key} className="min-w-16 flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium text-muted-foreground transition-colors",
                    active && "text-primary",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="truncate">{t(`short.${key}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function AccountNavSkeleton() {
  return <div className="hidden h-96 animate-pulse rounded-2xl bg-muted lg:block" aria-hidden="true" />;
}
