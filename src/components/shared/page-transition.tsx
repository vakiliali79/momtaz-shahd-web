"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "motion/react";

// The first page is server-rendered and must appear at once (no fade that
// would delay the largest paint); only later client navigations animate.
let navigated = false;

export function PageTransition({ children }: { children: ReactNode }) {
  const animate = navigated;
  useEffect(() => {
    navigated = true;
  }, []);
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
