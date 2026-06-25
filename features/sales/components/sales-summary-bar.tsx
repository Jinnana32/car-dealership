import type { ReactElement } from "react";

import type { SalesCollectionsSummary, SalesListSummary } from "@/features/sales/types";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type SalesSummaryBarProps = {
  collections: SalesCollectionsSummary;
  showingCount: number;
  summary: SalesListSummary;
  totalCount: number;
};

export function SalesSummaryBar({
  collections,
  showingCount,
  summary,
  totalCount,
}: SalesSummaryBarProps): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border bg-white px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="font-medium text-emerald-700">
          {formatVehicleCurrency(summary.totalSalesAmount)} total
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{summary.soldCount}</span>{" "}
            {summary.soldCount === 1 ? "deal" : "deals"}
          </span>
          <span>
            <span className="font-semibold text-foreground">{summary.cashCount}</span> cash
          </span>
          <span>
            <span className="font-semibold text-foreground">{summary.financingCount}</span>{" "}
            financing
          </span>
          {summary.soldCount > 0 ? (
            <span>
              Avg{" "}
              <span className="font-semibold text-foreground">
                {formatVehicleCurrency(summary.averageSoldPrice)}
              </span>
            </span>
          ) : null}
          {collections.overdueCount > 0 ? (
            <span className="font-medium text-amber-700">
              {collections.overdueCount} overdue
            </span>
          ) : null}
          {collections.openBalanceTotal > 0 ? (
            <span>
              Open balance{" "}
              <span className="font-semibold text-foreground">
                {formatVehicleCurrency(collections.openBalanceTotal)}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      <p className="text-muted-foreground">
        Showing {showingCount} of {totalCount}
      </p>
    </div>
  );
}
