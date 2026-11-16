import type { ComponentProps, ElementType } from "react";

import { cn } from "@/lib/utils";

type ContainerProps = ComponentProps<"div"> & {
  as?: ElementType;
};

/** Centred page gutter that scales from 320px phones up to 4K desktops. */
export function Container({ as: Tag = "div", className, ...props }: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 3xl:max-w-[110rem] 3xl:px-12",
        className,
      )}
      {...props}
    />
  );
}
