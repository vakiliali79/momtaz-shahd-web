import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Fades and lifts its children into place as they scroll into view, with
 * CSS scroll-driven animations (no JavaScript, nothing to hydrate). Browsers
 * without `animation-timeline` support, and reduced-motion users, simply see
 * the content in place. `delay` staggers items in a row (seconds).
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={cn("reveal", className)} style={{ "--reveal-delay": `${delay * 100}%` } as CSSProperties}>
      {children}
    </div>
  );
}
