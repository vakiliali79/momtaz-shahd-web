import Image from "next/image";

import { cn } from "@/lib/utils";

/** Square product photo (or the cream placeholder) filling its parent. */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      // SVG placeholders are served as-is; photos go through the optimizer.
      unoptimized={src.endsWith(".svg")}
      className={cn("object-cover", className)}
    />
  );
}
