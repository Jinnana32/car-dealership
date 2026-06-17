import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-[28px]" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

