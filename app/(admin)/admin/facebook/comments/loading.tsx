import type { ReactElement } from "react";

export default function FacebookCommentsLoading(): ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[20px] border border-border bg-[#fafaf9]"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-[20px] border border-border bg-[#fafaf9]" />
    </div>
  );
}
