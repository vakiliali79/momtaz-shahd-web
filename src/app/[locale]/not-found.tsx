import { useLocale, useTranslations } from "next-intl";

import { StatusPage } from "@/components/shared/status-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";

/** 404 outside the shop layout (e.g. in the admin panel). */
export default function NotFound() {
  const t = useTranslations("notFound");
  const locale = useLocale();
  return (
    <StatusPage
      variant="notFound"
      code={formatNumber(404, locale).replace(/[٬,]/g, "")}
      title={t("title")}
      description={t("description")}
      actions={
        <Button asChild size="lg" className="h-12 rounded-full px-6">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      }
    />
  );
}
