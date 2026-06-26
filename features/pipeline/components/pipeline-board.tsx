import type { ReactElement } from "react";

import { canAssignInquiries, canManageInquiryRecord } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/types";
import type { DealershipMemberOption } from "@/features/inquiries/types";
import { PipelineBoardCard } from "@/features/pipeline/components/pipeline-board-card";
import type { PipelineBoardColumn } from "@/features/pipeline/queries";
import { buildColumnSummary, getPipelineStageColors } from "@/features/pipeline/utils";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { cn } from "@/lib/utils";

type PipelineBoardProps = {
  columns: PipelineBoardColumn[];
  currentProfileId: string;
  memberOptions: DealershipMemberOption[];
  redirectPath: string;
  role: AppRole;
};

export function PipelineBoard({
  columns,
  currentProfileId,
  memberOptions,
  redirectPath,
  role,
}: PipelineBoardProps): ReactElement {
  const canAssign = canAssignInquiries(role);

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const columnSummary = buildColumnSummary(column.inquiries);
          const stageColors = getPipelineStageColors(column.stage.key);

          return (
            <section
              key={column.stage.key}
              className="flex h-[500px] min-w-0 flex-col rounded-[20px] border border-border bg-[#f4f4f5] shadow-sm"
              title={column.stage.description ?? undefined}
            >
              <div className={cn("shrink-0 px-3 py-2.5", stageColors.header)}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className={cn("text-sm font-semibold", stageColors.headerText)}>
                    {column.stage.label}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold",
                      stageColors.headerText,
                    )}
                  >
                    {columnSummary.count}
                  </span>
                </div>
                {columnSummary.totalValue > 0 ? (
                  <p className={cn("mt-0.5 text-xs font-medium", stageColors.headerMuted)}>
                    {formatVehicleCurrency(columnSummary.totalValue)}
                  </p>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {column.inquiries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-white px-3 py-5 text-center text-xs text-muted-foreground">
                    No inquiries
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {column.inquiries.map((inquiry) => (
                      <PipelineBoardCard
                        key={inquiry.id}
                        canAssign={canAssign}
                        canManage={canManageInquiryRecord(
                          role,
                          currentProfileId,
                          inquiry.assigned_to,
                        )}
                        inquiry={inquiry}
                        memberOptions={memberOptions}
                        redirectPath={redirectPath}
                        stageKey={column.stage.key}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
