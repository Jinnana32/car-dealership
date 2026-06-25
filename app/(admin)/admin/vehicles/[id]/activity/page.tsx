import type { ReactElement } from "react";

import {
  getVehicleDetailSearchParam,
  VehicleDetailToasts,
} from "@/features/vehicles/components/vehicle-detail-toasts";
import { VehicleActivityTab } from "@/features/vehicles/components/vehicle-activity-tab";
import { getVehicleDetailPageContext } from "@/features/vehicles/queries";
import { canManageVehicles } from "@/lib/auth/permissions";

type VehicleActivityPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

export default async function VehicleActivityPage({
  params,
  searchParams,
}: VehicleActivityPageProps): Promise<ReactElement | null> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const context = await getVehicleDetailPageContext(id);

  if (context.type !== "ok") {
    return null;
  }

  return (
    <>
      <VehicleDetailToasts
        error={getVehicleDetailSearchParam(resolvedSearchParams.error)}
        success={getVehicleDetailSearchParam(resolvedSearchParams.success)}
      />
      <VehicleActivityTab
        canManage={canManageVehicles(context.access.membership.role)}
        vehicle={context.record.vehicle}
      />
    </>
  );
}
