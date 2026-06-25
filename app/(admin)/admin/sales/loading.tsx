import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function SalesLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}
