"use client";

import { useEffect } from "react";
import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { StatusPage } from "@/components/shared/status-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Body of every error.tsx: friendly message, "try again", and a reference code for support. */
export function ErrorView({ error, reset, homeHref = "/" }: { error: Error & { digest?: string }; reset: () => void; homeHref?: string }) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      variant="error"
      title={t("title")}
      description={t("description")}
      actions={
        <>
          <Button size="lg" className="h-12 rounded-full px-6" onClick={() => reset()}>
            <RotateCcwIcon aria-hidden="true" />
            {t("retry")}
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
            <Link href={homeHref}>{t("home")}</Link>
          </Button>
        </>
      }
    >
      {error.digest ? (
        <p className="text-xs text-muted-foreground">
          {t("reference")} <code dir="ltr" className="rounded bg-muted px-1.5 py-0.5">{error.digest}</code>
        </p>
      ) : null}
    </StatusPage>
  );
}
