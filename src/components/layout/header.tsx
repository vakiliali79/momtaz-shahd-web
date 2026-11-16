import { Suspense } from "react";

import { SessionLoader } from "@/components/auth/session-loader";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AccountMenu } from "@/components/layout/account-menu";
import { Container } from "@/components/layout/container";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchForm } from "@/components/layout/search-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b print:hidden border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      {/* The session is per-request, so it streams in without blocking the page. */}
      <Suspense fallback={null}>
        <SessionLoader />
      </Suspense>
      <Container className="flex h-16 items-center gap-2">
        <MobileNav className="-ms-2 xl:hidden" />
        <Logo className="me-auto xl:me-4" />
        <MainNav className="hidden xl:block" />
        <SearchForm className="ms-auto hidden w-full max-w-64 md:block xl:max-w-56 2xl:max-w-72" />
        <div className="flex items-center gap-2 md:ms-2">
          <LanguageSwitcher className="max-[359px]:hidden" />
          <ThemeToggle className="max-[359px]:hidden" />
          <AccountMenu className="max-sm:hidden" />
          <CartDrawer />
        </div>
      </Container>
    </header>
  );
}
