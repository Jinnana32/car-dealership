import type { ReactElement } from "react";

import {
  getVehicleDetailSearchParam,
  VehicleDetailToasts,
} from "@/features/vehicles/components/vehicle-detail-toasts";
import { VehicleOverviewTab } from "@/features/vehicles/components/vehicle-overview-tab";
import { getVehicleDetailPageContext } from "@/features/vehicles/queries";

type VehicleOverviewPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

export default async function VehicleOverviewPage({
  params,
  searchParams,
}: VehicleOverviewPageProps): Promise<ReactElement | null> {
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
      <VehicleOverviewTab
        media={context.record.media}
        vehicle={context.record.vehicle}
      />
    </>
  );
}
