import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetailLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-border pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-[320px] w-full rounded-[20px]" />
        <Skeleton className="h-48 w-full rounded-[20px]" />
        <Skeleton className="h-32 w-full rounded-[20px]" />
      </div>
    </div>
  );
}
