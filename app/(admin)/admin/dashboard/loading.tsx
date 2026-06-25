import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-[20px]" />
        <Skeleton className="h-28 rounded-[20px]" />
        <Skeleton className="h-28 rounded-[20px]" />
        <Skeleton className="h-28 rounded-[20px]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-[20px]" />
        <Skeleton className="h-72 rounded-[20px]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Skeleton className="h-72 rounded-[20px]" />
        <Skeleton className="h-72 rounded-[20px]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">
        <Skeleton className="h-80 rounded-[20px]" />
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-[20px]" />
          <Skeleton className="h-40 rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}
