import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { FacebookLeadStatus } from "@/features/facebook/types";
import { getFacebookLeadStatusLabel } from "@/features/facebook/utils";
import { cn } from "@/lib/utils";

const statusStyles: Record<FacebookLeadStatus, string> = {
  duplicate: "border-slate-200 bg-slate-100 text-slate-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  processed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  received: "border-amber-200 bg-amber-50 text-amber-700",
};

type FacebookLeadStatusBadgeProps = {
  status: FacebookLeadStatus;
};

export function FacebookLeadStatusBadge({
  status,
}: FacebookLeadStatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", statusStyles[status])}
    >
      {getFacebookLeadStatusLabel(status)}
    </Badge>
  );
}
