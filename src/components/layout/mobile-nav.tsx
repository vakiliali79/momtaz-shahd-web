"use client";

import { useState } from "react";
import { LogOutIcon, MenuIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useLogout } from "@/components/auth/use-logout";
import { guestLinks, memberLinks, useAuthHref } from "@/components/layout/account-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LogoMark } from "@/components/layout/logo";
import { isActivePath } from "@/components/layout/main-nav";
import { SearchForm } from "@/components/layout/search-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNav } from "@/config/site";
import { getDirection } from "@/i18n/locales";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session";

export function MobileNav({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const status = useSessionStore((state) => state.status);
  const { logout, pending } = useLogout();
  const authHref = useAuthHref();
  const accountLinks = status === "user" ? memberLinks : guestLinks;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("header.openMenu")}
          className={className}
        >
          <MenuIcon aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        // The drawer opens from the inline-start edge: right in RTL, left in LTR.
        side={getDirection(locale) === "rtl" ? "right" : "left"}
        closeLabel={t("common.close")}
        className="w-[min(20rem,calc(100vw-2.5rem))] gap-0 overflow-y-auto"
      >
        <SheetHeader className="flex-row items-center gap-2 pe-12">
          <LogoMark className="size-8" />
          <div className="min-w-0">
            <SheetTitle>{t("brand.name")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("header.menuDescription")}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="px-4 pb-3">
          <SearchForm onSearch={close} />
        </div>

        <nav aria-label={t("nav.label")} className="px-2">
          <ul className="flex flex-col gap-1">
            {mainNav.map(({ key, href }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center rounded-xl px-3 text-base font-medium transition-colors hover:bg-muted",
                      active && "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Separator className="my-3" />

        <div className="px-2">
          <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
            {t("account.label")}
          </p>
          <ul className="flex flex-col gap-1">
            {accountLinks.map(({ key, href, Icon }) => (
              <li key={key}>
                <Link
                  href={status === "user" ? href : authHref(href)}
                  onClick={close}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {t(`account.${key}`)}
                </Link>
              </li>
            ))}
            {status === "user" ? (
              <li>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    close();
                    logout();
                  }}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <LogOutIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {t("account.signOut")}
                </button>
              </li>
            ) : null}
          </ul>
        </div>

        <Separator className="my-3" />

        <div className="px-4 pb-6">
          <p className="pb-2 text-xs font-medium text-muted-foreground">
            {t("header.settings")}
          </p>
          <div className="flex items-center gap-2">
            <LanguageSwitcher showName className="flex-1 border-border" />
            <ThemeToggle className="border-border" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
