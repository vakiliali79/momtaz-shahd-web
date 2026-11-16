import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountNav, AccountNavSkeleton } from "@/components/account/account-nav";
import { Container } from "@/components/layout/container";
import { getCurrentUser } from "@/lib/session";

// Per-user pages: nothing to prerender, so navigation waits for the server.
export const instant = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Reads the session, so it streams in behind <Suspense>. */
async function AccountNavLoader() {
  const user = await getCurrentUser();
  return <AccountNav name={user?.name ?? ""} isWholesale={user?.role === "WHOLESALE"} />;
}

export default function AccountLayout({ children }: LayoutProps<"/[locale]/account">) {
  return (
    <Container className="grid items-start gap-8 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:py-12">
      <Suspense fallback={<AccountNavSkeleton />}>
        <AccountNavLoader />
      </Suspense>
      <div className="min-w-0">{children}</div>
    </Container>
  );
}
