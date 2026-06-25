import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function SaleDetailLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <Skeleton className="h-[360px] w-full" />
        <Skeleton className="h-[280px] w-full" />
      </div>
    </div>
  );
}
