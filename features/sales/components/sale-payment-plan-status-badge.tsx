import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { SalePaymentPlanStatus } from "@/features/sales/types";
import { getSalePaymentPlanStatusLabel } from "@/features/sales/utils";
import { cn } from "@/lib/utils";

const statusStyles: Record<SalePaymentPlanStatus, string> = {
  cancelled: "border-red-200 bg-red-50 text-red-700",
  overdue: "border-amber-200 bg-amber-50 text-amber-700",
  paid_in_full: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partially_paid: "border-sky-200 bg-sky-50 text-sky-700",
  pending: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

type SalePaymentPlanStatusBadgeProps = {
  status: SalePaymentPlanStatus;
};

export function SalePaymentPlanStatusBadge({
  status,
}: SalePaymentPlanStatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", statusStyles[status])}
    >
      {getSalePaymentPlanStatusLabel(status)}
    </Badge>
  );
}
