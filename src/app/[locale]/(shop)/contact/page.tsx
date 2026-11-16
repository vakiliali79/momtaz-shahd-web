import type { Metadata } from "next";
import { ClockIcon, MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";

import { ContactForm } from "@/components/contact/contact-form";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { routing } from "@/i18n/routing";
import { getContactInfo } from "@/lib/data/settings";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations("contact");
  return pageMetadata({
    locale,
    path: "/contact",
    title: t("title"),
    description: t("lead"),
  });
}

export default async function ContactPage() {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const [t, contact] = await Promise.all([getTranslations(), getContactInfo()]);

  const details = [
    { Icon: MapPinIcon, label: t("footer.address"), value: contact.address[locale] || t("footer.addressValue") },
    ...(contact.phone
      ? [{ Icon: PhoneIcon, label: t("footer.phone"), value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, "")}` }]
      : []),
    ...(contact.whatsapp
      ? [{ Icon: MessageCircleIcon, label: t("contact.whatsapp"), value: contact.whatsapp, href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` }]
      : []),
    ...(contact.email ? [{ Icon: MailIcon, label: t("footer.email"), value: contact.email, href: `mailto:${contact.email}` }] : []),
    { Icon: ClockIcon, label: t("contact.hours"), value: contact.workingHours[locale] || t("contact.hoursValue") },
  ];

  return (
    <>
      <PageHeader
        title={t("contact.title")}
        description={t("contact.lead")}
        crumbs={[{ label: t("contact.title") }]}
      />
      <Container className="grid gap-8 section-y-sm lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        <section aria-labelledby="contact-info" className="space-y-4">
          <h2 id="contact-info" className="text-fluid-lg font-bold">
            {t("contact.infoTitle")}
          </h2>
          <ul className="space-y-3">
            {details.map(({ Icon, label, value, href }) => (
              <li key={label} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-gold-ink">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {href ? (
                    <a href={href} dir="ltr" className="touch-target inline-block rounded font-medium break-all hover:text-primary">
                      {value}
                    </a>
                  ) : (
                    <p className="font-medium">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="contact-form"
          className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8"
        >
          <h2 id="contact-form" className="mb-6 text-fluid-lg font-bold">
            {t("contact.formTitle")}
          </h2>
          <ContactForm />
        </section>
      </Container>
    </>
  );
}
