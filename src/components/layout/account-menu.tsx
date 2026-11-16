"use client";

import { LogInIcon, PackageIcon, UserIcon, UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";

export const accountLinks = [
  { key: "signIn", href: "/login", Icon: LogInIcon },
  { key: "register", href: "/register", Icon: UserPlusIcon },
  { key: "orders", href: "/account/orders", Icon: PackageIcon },
] as const;

export function AccountMenu({ className }: { className?: string }) {
  const t = useTranslations("account");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("label")}
          className={className}
        >
          <UserIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>{t("guest")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountLinks.map(({ key, href, Icon }) => (
          <DropdownMenuItem key={key} asChild>
            <Link href={href} className="gap-2">
              <Icon aria-hidden="true" />
              <span>{t(key)}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
