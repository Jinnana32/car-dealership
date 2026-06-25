import type { ReactElement } from "react";

import {
  getVehicleDetailSearchParam,
  VehicleDetailToasts,
} from "@/features/vehicles/components/vehicle-detail-toasts";
import { VehicleSalesTab } from "@/features/vehicles/components/vehicle-sales-tab";
import { getVehicleSalesContext } from "@/features/sales/queries";
import { getVehicleDetailPageContext } from "@/features/vehicles/queries";
import { canManageVehicles, canRecordSales } from "@/lib/auth/permissions";

type VehicleSalesPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

export default async function VehicleSalesPage({
  params,
  searchParams,
}: VehicleSalesPageProps): Promise<ReactElement | null> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const context = await getVehicleDetailPageContext(id);

  if (context.type !== "ok") {
    return null;
  }

  const salesContext = await getVehicleSalesContext(
    context.access,
    context.record.vehicle.id,
  );

  return (
    <>
      <VehicleDetailToasts
        error={getVehicleDetailSearchParam(resolvedSearchParams.error)}
        success={getVehicleDetailSearchParam(resolvedSearchParams.success)}
      />
      <VehicleSalesTab
        canManage={canManageVehicles(context.access.membership.role)}
        canRecordSale={canRecordSales(context.access.membership.role)}
        salesContext={salesContext}
        vehicle={context.record.vehicle}
      />
    </>
  );
}
