"use client";

import { useTransition } from "react";
import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { getCartProducts } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";

/**
 * Puts the products of an earlier order back in the cart (at today's prices
 * and stock) and opens checkout.
 */
export function ReorderButton({
  items,
  variant = "default",
}: {
  items: { productId: string; quantity: number }[];
  /** "outline" is the compact style used next to other order actions. */
  variant?: "default" | "outline";
}) {
  const t = useTranslations("order.failed");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size="lg"
      className={cn("rounded-full", variant === "default" ? "h-12 px-8 text-base" : "h-10 px-4")}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const products = await getCartProducts(items.map((item) => item.productId)).catch(() => []);
          const { addItem } = useCartStore.getState();
          let missing = 0;
          for (const item of items) {
            const product = products.find((entry) => entry.productId === item.productId);
            const added = product ? addItem(product, item.quantity).added : 0;
            if (added < item.quantity) missing += 1;
          }
          if (missing > 0) toast.warning(t("reorderPartial"));
          router.push("/checkout");
        })
      }
    >
      <RotateCcwIcon aria-hidden="true" />
      {pending ? t("reordering") : t("reorder")}
    </Button>
  );
}
