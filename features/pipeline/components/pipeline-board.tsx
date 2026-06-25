import type { ReactElement } from "react";

import { canAssignInquiries, canManageInquiryRecord } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/types";
import type { DealershipMemberOption } from "@/features/inquiries/types";
import { PipelineBoardCard } from "@/features/pipeline/components/pipeline-board-card";
import type { PipelineBoardColumn } from "@/features/pipeline/queries";

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
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1460px] grid-cols-7 gap-4">
        {columns.map((column) => (
          <section
            key={column.stage.key}
            className="rounded-[20px] border border-border bg-[#f8f6f3] p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {column.stage.label}
                </h2>
                {column.stage.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {column.stage.description}
                  </p>
                ) : null}
              </div>
              <div className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-semibold text-foreground">
                {column.inquiries.length}
              </div>
            </div>

            {column.inquiries.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-border bg-white px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No inquiries</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This stage is clear.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
