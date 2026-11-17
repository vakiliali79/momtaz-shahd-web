import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Card that lifts on hover and dips when pressed, with a spring-like CSS
 * curve (no JavaScript per card). Reduced-motion users get no movement.
 */
export function MotionCard({ className, ...props }: ComponentProps<"article">) {
  return <article className={cn("lift", className)} {...props} />;
}
