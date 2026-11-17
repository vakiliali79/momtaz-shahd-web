import { cn } from "@/lib/utils";

/**
 * A koloocheh with a bite taken out, for the 404 and error pages. Pure SVG
 * in brand colours; decorative (the page heading says what happened).
 */
export function StatusIllustration({ variant, className }: { variant: "notFound" | "error"; className?: string }) {
  return (
    <svg viewBox="0 0 240 200" aria-hidden="true" className={cn("h-auto w-48 sm:w-60", className)}>
      <ellipse cx="120" cy="182" rx="78" ry="9" className="fill-brand-ink/10 dark:fill-black/40" />
      {/* Cookie with a bite: a circle masked by two "teeth" circles. */}
      <defs>
        <mask id={`bite-${variant}`}>
          <rect width="240" height="200" fill="#fff" />
          <circle cx="186" cy="52" r="24" fill="#000" />
          <circle cx="198" cy="84" r="20" fill="#000" />
          <circle cx="176" cy="30" r="14" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#bite-${variant})`}>
        <circle cx="120" cy="100" r="78" fill="#d9a066" />
        <circle cx="120" cy="100" r="78" fill="none" stroke="#b8763e" strokeWidth="6" />
        <circle cx="120" cy="100" r="58" fill="none" stroke="#c98f55" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
        {/* Stamped pattern of a traditional koloocheh. */}
        <path d="M120 52 L132 88 L170 100 L132 112 L120 148 L108 112 L70 100 L108 88 Z" fill="#c4844a" opacity="0.7" />
        <circle cx="120" cy="100" r="9" fill="#8a5a2b" />
        {/* Walnut pieces. */}
        <ellipse cx="88" cy="70" rx="7" ry="5" fill="#7a4e25" transform="rotate(-20 88 70)" />
        <ellipse cx="150" cy="138" rx="6" ry="4.5" fill="#7a4e25" transform="rotate(25 150 138)" />
        <ellipse cx="84" cy="134" rx="5" ry="4" fill="#7a4e25" />
      </g>
      {/* Crumbs. */}
      <circle cx="214" cy="118" r="4" fill="#d9a066" />
      <circle cx="226" cy="104" r="2.5" fill="#d9a066" />
      <circle cx="206" cy="134" r="2" fill="#b8763e" />
      {variant === "error" ? (
        // A little leaf, from the logo, to keep it friendly.
        <path d="M44 34c18-4 30 4 32 18-16 4-30-2-32-18z" fill="#3e8e41" />
      ) : null}
    </svg>
  );
}
