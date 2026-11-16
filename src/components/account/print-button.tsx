"use client";

import { PrinterIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useTranslations("accountPages.invoice");
  return (
    <Button size="lg" className="h-11 rounded-full px-6 print:hidden" onClick={() => window.print()}>
      <PrinterIcon aria-hidden="true" />
      {t("print")}
    </Button>
  );
}
