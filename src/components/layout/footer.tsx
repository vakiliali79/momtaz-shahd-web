import type { ReactNode } from "react";
import { MailIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { mainNav, siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="size-5"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.500" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold tracking-wide text-foreground">
      {children}
    </h2>
  );
}

export function Footer({ year }: { year: string }) {
  const t = useTranslations();

  return (
    <footer className="mt-auto border-t border-border bg-muted/50 print:hidden">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.4fr] lg:gap-8 lg:py-16">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            {t("footer.about")}
          </p>
          <div>
            <h2 className="sr-only">{t("footer.socialTitle")}</h2>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("footer.instagram")}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium transition-colors hover:border-brand-gold hover:text-primary"
            >
              <InstagramIcon />
              <span dir="ltr">@momtaz_shahd</span>
            </a>
          </div>
        </div>

        <nav aria-label={t("footer.quickLinks")}>
          <FooterHeading>{t("footer.quickLinks")}</FooterHeading>
          <ul className="space-y-1 text-sm">
            {mainNav.map(({ key, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="inline-block rounded py-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <FooterHeading>{t("footer.contactTitle")}</FooterHeading>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <MapPinIcon className="mt-1 size-4 shrink-0 text-brand-gold" aria-hidden="true" />
              <span>
                <span className="sr-only">{t("footer.address")}: </span>
                {t("footer.addressValue")}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <PhoneIcon className="size-4 shrink-0 text-brand-gold" aria-hidden="true" />
              <span className="sr-only">{t("footer.phone")}: </span>
              <a
                href={`tel:${siteConfig.phone.replaceAll(" ", "")}`}
                dir="ltr"
                className="rounded transition-colors hover:text-primary"
              >
                {siteConfig.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MailIcon className="size-4 shrink-0 text-brand-gold" aria-hidden="true" />
              <span className="sr-only">{t("footer.email")}: </span>
              <a
                href={`mailto:${siteConfig.email}`}
                dir="ltr"
                className="rounded break-all transition-colors hover:text-primary"
              >
                {siteConfig.email}
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-8">
          <div>
            <FooterHeading>{t("newsletter.title")}</FooterHeading>
            <p className="mb-3 text-sm leading-6 text-muted-foreground">
              {t("newsletter.description")}
            </p>
            <NewsletterForm />
          </div>
          <div>
            <FooterHeading>{t("footer.trustTitle")}</FooterHeading>
            {/* Placeholder: replace with the official Enamad badge snippet once issued. */}
            <div
              role="img"
              aria-label={t("footer.enamad")}
              className="grid size-24 place-items-center gap-1 rounded-2xl border border-dashed border-input bg-background p-2 text-center text-xs text-muted-foreground"
            >
              <ShieldCheckIcon className="size-7 text-brand-leaf" aria-hidden="true" />
              <span>{t("footer.enamadPlaceholder")}</span>
            </div>
          </div>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="py-5 text-center text-xs text-muted-foreground">
          {t("footer.rights", { year })}
        </Container>
      </div>
    </footer>
  );
}
