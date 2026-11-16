import { useTranslations } from "next-intl";

/** First focusable element on every page: jumps past the header to the content. */
export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:z-[60] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-lg focus:bg-brand-red focus:px-4 focus:text-sm focus:font-medium focus:text-white focus:shadow-soft"
    >
      {t("skipToContent")}
    </a>
  );
}
