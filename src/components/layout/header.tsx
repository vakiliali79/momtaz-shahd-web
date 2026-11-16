import { useTranslations } from "next-intl";

import { AccountMenu } from "@/components/layout/account-menu";
import { CartButton } from "@/components/layout/cart-button";
import { Container } from "@/components/layout/container";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchForm } from "@/components/layout/search-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>
      <Container className="flex h-16 items-center gap-1 sm:gap-2">
        <MobileNav className="-ms-2 xl:hidden" />
        <Logo className="me-auto xl:me-4" />
        <MainNav className="hidden xl:block" />
        <SearchForm className="ms-auto hidden w-full max-w-64 md:block xl:max-w-56 2xl:max-w-72" />
        <div className="flex items-center gap-0.5 sm:gap-1 md:ms-2">
          <LanguageSwitcher className="max-[359px]:hidden" />
          <ThemeToggle className="max-[359px]:hidden" />
          <AccountMenu className="max-sm:hidden" />
          <CartButton />
        </div>
      </Container>
    </header>
  );
}
