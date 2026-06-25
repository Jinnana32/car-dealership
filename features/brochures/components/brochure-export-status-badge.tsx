import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { BrochureExportStatus } from "@/features/brochures/types";
import { getBrochureExportStatusLabel } from "@/features/brochures/utils";
import { cn } from "@/lib/utils";

const statusStyles: Record<BrochureExportStatus, string> = {
  failed: "border-red-200 bg-red-50 text-red-700",
  generated: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
};

type BrochureExportStatusBadgeProps = {
  status: BrochureExportStatus;
};

export function BrochureExportStatusBadge({
  status,
}: BrochureExportStatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", statusStyles[status])}
    >
      {getBrochureExportStatusLabel(status)}
    </Badge>
  );
}
