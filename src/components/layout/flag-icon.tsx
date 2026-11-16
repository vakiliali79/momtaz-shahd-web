import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Small decorative flags for the language switcher (simplified artwork). */
export function FlagIcon({
  locale,
  className,
}: {
  locale: AppLocale;
  className?: string;
}) {
  const shared = {
    viewBox: "0 0 24 16",
    "aria-hidden": true,
    focusable: false,
    className: cn(
      "h-4 w-6 shrink-0 rounded-[3px] ring-1 ring-foreground/10",
      className,
    ),
  } as const;

  if (locale === "fa") {
    return (
      <svg {...shared}>
        <rect width="24" height="16" fill="#fff" />
        <rect width="24" height="5.33" fill="#239f40" />
        <rect y="10.67" width="24" height="5.33" fill="#da0000" />
        <circle cx="12" cy="8" r="1.4" fill="#da0000" />
      </svg>
    );
  }

  if (locale === "ar") {
    return (
      <svg {...shared}>
        <rect width="24" height="16" fill="#fff" />
        <rect width="24" height="5.33" fill="#00732f" />
        <rect y="10.67" width="24" height="5.33" fill="#000" />
        <rect width="6" height="16" fill="#f00" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" strokeWidth="1.2" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5.4" />
      <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="3.2" />
    </svg>
  );
}
