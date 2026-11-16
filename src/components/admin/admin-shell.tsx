"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BoxesIcon,
  ExternalLinkIcon,
  FolderTreeIcon,
  HandshakeIcon,
  LanguagesIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  StarIcon,
  StoreIcon,
  TicketPercentIcon,
  UsersIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useLogout } from "@/components/auth/use-logout";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LogoMark } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDirection } from "@/i18n/locales";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdminUi } from "@/stores/admin-ui";

export const adminNav = [
  { key: "dashboard", href: "/admin", Icon: LayoutDashboardIcon },
  { key: "orders", href: "/admin/orders", Icon: PackageIcon },
  { key: "products", href: "/admin/products", Icon: BoxesIcon },
  { key: "categories", href: "/admin/categories", Icon: FolderTreeIcon },
  { key: "customers", href: "/admin/customers", Icon: UsersIcon },
  { key: "wholesale", href: "/admin/wholesale", Icon: HandshakeIcon },
  { key: "dealers", href: "/admin/dealers", Icon: StoreIcon },
  { key: "coupons", href: "/admin/coupons", Icon: TicketPercentIcon },
  { key: "reviews", href: "/admin/reviews", Icon: StarIcon },
  { key: "settings", href: "/admin/settings", Icon: SettingsIcon },
  { key: "translations", href: "/admin/translations", Icon: LanguagesIcon },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {adminNav.map(({ key, href, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? t(key) : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden="true" />
              <span className={cn(collapsed && "sr-only")}>{t(key)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Admin chrome: collapsible sidebar on desktop, drawer on mobile, top bar. */
export function AdminShell({ adminName, children }: { adminName: string; children: ReactNode }) {
  const t = useTranslations("admin.shell");
  const locale = useLocale();
  const collapsed = useAdminUi((state) => state.collapsed);
  const toggle = useAdminUi((state) => state.toggle);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logout, pending } = useLogout();

  useEffect(() => {
    void useAdminUi.persist.rehydrate();
  }, []);

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-border bg-card transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className={cn("flex h-16 items-center gap-2 border-b border-border px-4", collapsed && "justify-center px-0")}>
          <LogoMark className="size-8" />
          {!collapsed ? <span className="truncate font-bold">{t("title")}</span> : null}
        </div>
        <nav aria-label={t("navLabel")} className="flex-1 overflow-y-auto p-2">
          <NavList collapsed={collapsed} />
        </nav>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className={cn("h-10 w-full justify-start gap-3 rounded-xl px-3", collapsed && "justify-center px-0")}
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t("expand") : t("collapse")}
          >
            {collapsed ? (
              <PanelLeftOpenIcon className="size-4.5 rtl:-scale-x-100" aria-hidden="true" />
            ) : (
              <PanelLeftCloseIcon className="size-4.5 rtl:-scale-x-100" aria-hidden="true" />
            )}
            {!collapsed ? <span className="text-sm">{t("collapse")}</span> : null}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur print:hidden">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label={t("openMenu")}>
                <MenuIcon aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={getDirection(locale) === "rtl" ? "right" : "left"}
              closeLabel={t("closeMenu")}
              className="w-72 gap-0"
            >
              <SheetHeader className="border-b border-border">
                <SheetTitle>{t("title")}</SheetTitle>
                <SheetDescription className="sr-only">{t("navLabel")}</SheetDescription>
              </SheetHeader>
              <nav aria-label={t("navLabel")} className="overflow-y-auto p-2">
                <NavList collapsed={false} onNavigate={() => setDrawerOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
          <p className="truncate text-sm text-muted-foreground">{t("signedInAs", { name: adminName })}</p>
          <div className="ms-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/" target="_blank">
                <ExternalLinkIcon className="rtl:-scale-x-100" aria-hidden="true" />
                <span className="max-sm:sr-only">{t("viewStore")}</span>
              </Link>
            </Button>
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="icon-lg" onClick={logout} disabled={pending} aria-label={t("signOut")}>
              <LogOutIcon className="rtl:-scale-x-100" aria-hidden="true" />
            </Button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 outline-none sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
