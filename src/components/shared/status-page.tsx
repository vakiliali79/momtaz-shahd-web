import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { StatusIllustration } from "@/components/shared/status-illustration";

/** Shared layout of the 404 and error pages. */
export function StatusPage({
  variant,
  code,
  title,
  description,
  actions,
  children,
}: {
  variant: "notFound" | "error";
  /** e.g. "۴۰۴", already in the locale's digits. */
  code?: string;
  title: string;
  description: string;
  actions: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Container className="grid min-h-[min(70dvh,44rem)] place-items-center section-y">
      <div className="flex max-w-xl flex-col items-center text-center">
        <StatusIllustration variant={variant} />
        {code ? (
          <p className="mt-4 text-fluid-display font-black tracking-tight text-primary/90 tabular-nums" aria-hidden="true">
            {code}
          </p>
        ) : null}
        <h1 className="mt-2 text-fluid-2xl font-bold text-balance">{title}</h1>
        <p className="mt-3 max-w-md leading-7 text-pretty text-muted-foreground">{description}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>
        {children ? <div className="mt-10 w-full">{children}</div> : null}
      </div>
    </Container>
  );
}
