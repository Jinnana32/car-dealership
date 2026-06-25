import type { ReactElement, ReactNode } from "react";

import { PageContent } from "@/components/layout/page-content";
import { VehicleAvailabilityBadge } from "@/features/vehicles/components/vehicle-availability-badge";
import { VehicleDetailActions } from "@/features/vehicles/components/vehicle-detail-actions";
import { VehicleDetailTabs } from "@/features/vehicles/components/vehicle-detail-tabs";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import type { Vehicle, VehicleMediaWithSignedUrl } from "@/features/vehicles/types";
import { getVehicleSummaryLine } from "@/features/vehicles/utils";

type VehicleDetailShellProps = {
  canManage: boolean;
  children: ReactNode;
  media: VehicleMediaWithSignedUrl[];
  vehicle: Vehicle;
};

export function VehicleDetailShell({
  canManage,
  children,
  vehicle,
}: VehicleDetailShellProps): ReactElement {
  return (
    <PageContent
      actions={
        <>
          <VehicleStatusBadge status={vehicle.status} />
          <VehicleAvailabilityBadge availability={vehicle.availability} />
          <VehicleDetailActions canManage={canManage} vehicleId={vehicle.id} />
        </>
      }
      description={getVehicleSummaryLine(vehicle)}
      tabs={<VehicleDetailTabs vehicleId={vehicle.id} />}
      title={vehicle.title}
    >
      {children}
    </PageContent>
  );
}
