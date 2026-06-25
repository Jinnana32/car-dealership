import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function FacebookHubLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-[320px] w-full" />
      <Skeleton className="h-[280px] w-full" />
    </div>
  );
}
