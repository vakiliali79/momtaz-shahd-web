"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

/** Subtle entrance for the hero product image: fade, lift and settle. */
export function HeroVisual({ children }: { children: ReactNode }) {
  return (
    <motion.div
      data-reveal
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-lg lg:max-w-none"
    >
      {children}
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute -end-3 -top-3 size-16 rounded-full bg-brand-red shadow-soft sm:size-20"
      />
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="absolute -start-2 bottom-8 size-10 rounded-full bg-brand-leaf shadow-soft sm:size-12"
      />
    </motion.div>
  );
}

export function HeroText({ children }: { children: ReactNode }) {
  return (
    <motion.div
      data-reveal
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
