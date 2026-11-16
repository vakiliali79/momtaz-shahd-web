import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Brand mark: red badge with a green leaf. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={cn("size-9 shrink-0", className)}
    >
      <circle cx="24" cy="24" r="22" fill="var(--brand-red)" />
      <circle
        cx="24"
        cy="24"
        r="17.5"
        fill="none"
        stroke="var(--brand-cream)"
        strokeWidth="1.25"
        strokeDasharray="1.5 3"
        strokeLinecap="round"
      />
      <path
        d="M24 35c-6.5-2.8-9.5-8-8.2-15.5C22 19.800 27.800 16.500 31.500 12c3.700 8.500 1.800 18.500-7.500 23z"
        fill="var(--brand-leaf)"
        stroke="var(--brand-cream)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M24 34c1-6 3.200-11 6.300-16"
        fill="none"
        stroke="var(--brand-cream)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  const t = useTranslations("brand");

  return (
    <Link
      href="/"
      aria-label={t("homeLabel")}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-lg font-bold text-foreground",
        className,
      )}
    >
      <LogoMark />
      <span className="text-lg leading-none whitespace-nowrap">{t("name")}</span>
    </Link>
  );
}
