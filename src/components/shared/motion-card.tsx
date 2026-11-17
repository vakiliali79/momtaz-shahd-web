"use client";

import type { ComponentProps } from "react";
import * as m from "motion/react-m";

/**
 * Card that lifts on hover and dips when pressed (spring). Reduced-motion
 * users get no movement: MotionConfig in the providers is set to "user".
 */
export function MotionCard({ className, children, ...props }: ComponentProps<typeof m.article>) {
  return (
    <m.article
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={className}
      {...props}
    >
      {children}
    </m.article>
  );
}
