import { cn } from "@/lib/utils"

/**
 * Placeholder block with a soft shimmer that runs in the reading direction
 * (right to left for Persian and Arabic). Static for reduced-motion users.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative isolate overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-z-0 before:bg-linear-to-r before:from-transparent before:via-foreground/[0.06] before:to-transparent before:animate-shimmer",
        "rtl:before:[animation-direction:reverse] motion-reduce:before:hidden",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
