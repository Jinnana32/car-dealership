import type { ReactElement } from "react";

import {
  getVehicleDetailSearchParam,
  VehicleDetailToasts,
} from "@/features/vehicles/components/vehicle-detail-toasts";
import { VehiclePhotosTab } from "@/features/vehicles/components/vehicle-photos-tab";
import { getVehicleDetailPageContext } from "@/features/vehicles/queries";
import { canManageVehicles } from "@/lib/auth/permissions";

type VehiclePhotosPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

export default async function VehiclePhotosPage({
  params,
  searchParams,
}: VehiclePhotosPageProps): Promise<ReactElement | null> {
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
      <VehiclePhotosTab
        canManage={canManageVehicles(context.access.membership.role)}
        media={context.record.media}
        vehicle={context.record.vehicle}
      />
    </>
  );
}
