import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export function OrderPageShell({ children }: { children: ReactNode }) {
  return (
    <Container className="section-y-sm">
      <div className="mx-auto max-w-3xl">{children}</div>
    </Container>
  );
}

export function OrderPageSkeleton() {
  return (
    <OrderPageShell>
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </OrderPageShell>
  );
}
