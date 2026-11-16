import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <Container className="grid min-h-[50vh] place-items-center py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-fluid-2xl font-bold">{t("title")}</h1>
        <p className="mx-auto max-w-md text-muted-foreground">{t("description")}</p>
        <Button asChild size="lg" className="rounded-full px-5">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </Container>
  );
}
