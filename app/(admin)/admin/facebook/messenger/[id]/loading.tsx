import type { ReactElement } from "react";

export default function FacebookMessengerDetailLoading(): ReactElement {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-[20px] border border-border bg-white" />
        <div className="h-[520px] animate-pulse rounded-[20px] border border-border bg-white" />
      </div>
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-[20px] border border-border bg-white" />
        <div className="h-[720px] animate-pulse rounded-[20px] border border-border bg-white" />
      </div>
    </div>
  );
}
