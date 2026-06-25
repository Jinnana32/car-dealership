import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function FacebookLeadsLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  );
}
