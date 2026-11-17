import type { ReactNode } from "react";

/*
 * Hero entrance in CSS, not JavaScript: the text and image are visible from
 * the first paint (only position animates), so the largest contentful paint
 * is never held back waiting for scripts. Reduced motion turns it off.
 */

/** The hero product image: lifts into place; two brand dots pop in after. */
export function HeroVisual({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-lg motion-safe:animate-rise lg:max-w-none">
      {children}
      <span
        aria-hidden="true"
        className="absolute -end-3 -top-3 size-16 rounded-full bg-brand-red shadow-soft motion-safe:animate-pop sm:size-20"
        style={{ animationDelay: "0.45s" }}
      />
      <span
        aria-hidden="true"
        className="absolute -start-2 bottom-8 size-10 rounded-full bg-brand-leaf shadow-soft motion-safe:animate-pop sm:size-12"
        style={{ animationDelay: "0.6s" }}
      />
    </div>
  );
}

export function HeroText({ children }: { children: ReactNode }) {
  return <div className="space-y-6 motion-safe:animate-rise">{children}</div>;
}
