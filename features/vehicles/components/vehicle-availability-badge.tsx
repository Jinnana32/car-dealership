import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { VehicleAvailability } from "@/features/vehicles/types";
import { getVehicleAvailabilityLabel } from "@/features/vehicles/utils";
import { cn } from "@/lib/utils";

const availabilityStyles: Record<VehicleAvailability, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reserved: "border-blue-200 bg-blue-50 text-blue-700",
  sold: "border-zinc-200 bg-zinc-100 text-zinc-700",
  unavailable: "border-slate-200 bg-slate-100 text-slate-700",
};

type VehicleAvailabilityBadgeProps = {
  availability: VehicleAvailability;
};

export function VehicleAvailabilityBadge({
  availability,
}: VehicleAvailabilityBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", availabilityStyles[availability])}
    >
      {getVehicleAvailabilityLabel(availability)}
    </Badge>
  );
}
