import { PageTransition } from "@/components/shared/page-transition";

/** Re-mounted on every navigation, so each new page fades in. */
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
