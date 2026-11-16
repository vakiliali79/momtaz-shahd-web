"use client";

import {
  HeartIcon,
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  PackageIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { useLogout } from "@/components/auth/use-logout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { useSessionStore } from "@/stores/session";

export const guestLinks = [
  { key: "signIn", href: "/login", Icon: LogInIcon },
  { key: "register", href: "/register", Icon: UserPlusIcon },
] as const;

export const memberLinks = [
  { key: "myAccount", href: "/account", Icon: LayoutDashboardIcon },
  { key: "orders", href: "/account/orders", Icon: PackageIcon },
  { key: "wishlist", href: "/account/wishlist", Icon: HeartIcon },
] as const;

/** Sign-in links that bring the visitor back to the current page afterwards. */
export function useAuthHref() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === "/login" || pathname === "/register"
      ? href
      : { pathname: href, query: { callbackUrl: pathname } };
}

export function AccountMenu({ className }: { className?: string }) {
  const t = useTranslations("account");
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const { logout, pending } = useLogout();
  const authHref = useAuthHref();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label={t("label")} className={className}>
          <UserIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="truncate">
          {status === "user" && user ? t("greeting", { name: user.name }) : t("guest")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {status === "user"
          ? memberLinks.map(({ key, href, Icon }) => (
              <DropdownMenuItem key={key} asChild>
                <Link href={href} className="gap-2">
                  <Icon aria-hidden="true" />
                  <span>{t(key)}</span>
                </Link>
              </DropdownMenuItem>
            ))
          : guestLinks.map(({ key, href, Icon }) => (
              <DropdownMenuItem key={key} asChild disabled={status === "loading"}>
                <Link href={authHref(href)} className="gap-2">
                  <Icon aria-hidden="true" />
                  <span>{t(key)}</span>
                </Link>
              </DropdownMenuItem>
            ))}
        {status === "user" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} disabled={pending} className="gap-2">
              <LogOutIcon className="rtl:-scale-x-100" aria-hidden="true" />
              <span>{t("signOut")}</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
