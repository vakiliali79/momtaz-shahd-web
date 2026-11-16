import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Container className="grid place-items-center py-10 sm:py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="mb-6 space-y-2 text-center">
          <LogoMark className="mx-auto size-12" />
          <h1 className="text-fluid-lg font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </Container>
  );
}

export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-hidden="true">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-12 rounded-full" />
    </div>
  );
}
