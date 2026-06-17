import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-[28px]" />
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="h-[420px] w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

