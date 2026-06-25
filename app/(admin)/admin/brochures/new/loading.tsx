import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function NewBrochureLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-[560px] w-full" />
    </div>
  );
}
