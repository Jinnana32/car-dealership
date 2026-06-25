import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { VehicleStatus } from "@/features/vehicles/types";
import { getVehicleStatusLabel } from "@/features/vehicles/utils";
import { cn } from "@/lib/utils";

const statusStyles: Record<VehicleStatus, string> = {
  archived: "border-slate-200 bg-slate-100 text-slate-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reserved: "border-blue-200 bg-blue-50 text-blue-700",
  sold: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

type VehicleStatusBadgeProps = {
  status: VehicleStatus;
};

export function VehicleStatusBadge({
  status,
}: VehicleStatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", statusStyles[status])}
    >
      {getVehicleStatusLabel(status)}
    </Badge>
  );
}
