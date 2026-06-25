import type { ReactElement } from "react";

import { VehicleAvailabilityBadge } from "@/features/vehicles/components/vehicle-availability-badge";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import type { VehicleAvailability, VehicleStatus } from "@/features/vehicles/types";

type VehicleInventoryBadgeProps = {
  availability: VehicleAvailability;
  status: VehicleStatus;
};

export function VehicleInventoryBadge({
  availability,
  status,
}: VehicleInventoryBadgeProps): ReactElement {
  const showAvailabilityBadge =
    availability !== "available" || status === "draft" || status === "archived";

  if (!showAvailabilityBadge) {
    return <VehicleStatusBadge status={status} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <VehicleStatusBadge status={status} />
      <VehicleAvailabilityBadge availability={availability} />
    </div>
  );
}
