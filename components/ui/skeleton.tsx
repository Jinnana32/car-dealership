import type { HTMLAttributes, ReactElement } from "react";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div
      className={cn("animate-pulse rounded-[20px] bg-muted/80", className)}
      {...props}
    />
  );
}

export { Skeleton };
