import type { ReactElement } from "react";

export default function FacebookMessengerLoading(): ReactElement {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`messenger-stat-${index}`}
            className="h-24 animate-pulse rounded-[20px] border border-border bg-white"
          />
        ))}
      </div>

      <div className="h-20 animate-pulse rounded-[20px] border border-border bg-white" />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="h-[520px] animate-pulse rounded-[20px] border border-border bg-white" />
        <div className="h-[520px] animate-pulse rounded-[20px] border border-border bg-white" />
      </div>
    </div>
  );
}
