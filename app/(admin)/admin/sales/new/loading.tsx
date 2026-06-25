import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function QuickSaleLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}
