import type { ReactElement } from "react";

import type { PipelineSummary } from "@/features/pipeline/types";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type PipelineSummaryBarProps = {
  showingCount: number;
  summary: PipelineSummary;
  totalCount: number;
};

export function PipelineSummaryBar({
  showingCount,
  summary,
  totalCount,
}: PipelineSummaryBarProps): ReactElement {
  const hasValueSummary = summary.pipeValue > 0 || summary.closedValue > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border bg-white px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {hasValueSummary ? (
          <p className="font-medium text-emerald-700">
            {formatVehicleCurrency(summary.pipeValue)} in pipe
            <span className="mx-2 text-muted-foreground">/</span>
            {formatVehicleCurrency(summary.closedValue)} closed
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{summary.activeCount}</span> active
          </span>
          <span>
            <span className="font-semibold text-foreground">{summary.overdueCount}</span> overdue
          </span>
          <span>
            <span className="font-semibold text-foreground">{summary.unassignedCount}</span>{" "}
            unassigned
          </span>
        </div>
      </div>

      <p className="text-muted-foreground">
        Showing {showingCount} of {totalCount}
      </p>
    </div>
  );
}
