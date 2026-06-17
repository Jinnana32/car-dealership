import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading(): ReactElement {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-16 w-full rounded-[28px]" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
