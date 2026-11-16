"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";

export function AddToCartButton({
  productId,
  productName,
  unitPrice,
}: {
  productId: string;
  productName: string;
  unitPrice: number;
}) {
  const t = useTranslations("cart");
  const addItem = useCartStore((state) => state.addItem);

  return (
    <Button
      size="lg"
      className="rounded-full px-4"
      aria-label={`${t("add")} — ${productName}`}
      onClick={() => {
        addItem({ id: productId, unitPrice });
        toast.success(t("added", { name: productName }));
      }}
    >
      <PlusIcon aria-hidden="true" />
      {t("add")}
    </Button>
  );
}
