import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineReportLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-[420px] w-full" />
    </div>
  );
}
