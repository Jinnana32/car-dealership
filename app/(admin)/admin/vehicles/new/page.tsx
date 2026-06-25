import Link from "next/link";
import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "@/features/vehicles/components/vehicle-form";
import { getDealershipVehicleCatalog } from "@/features/vehicles/catalog";
import { canManageVehicles } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

export default async function NewVehiclePage(): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canManageVehicles(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Vehicle management access required"
        description="Only owners and admins can add vehicles to the dealership inventory."
      />
    );
  }

  return (
    <PageContent
      title="Add Vehicle"
      description="Create a new inventory record."
      actions={
        <Button asChild variant="outline">
          <Link href="/admin/vehicles">Back to Vehicles</Link>
        </Button>
      }
    >
      <VehicleForm
        catalog={getDealershipVehicleCatalog(access.dealership.vehicle_catalog)}
        financingAprPercent={access.dealership.default_financing_apr_percent}
        mode="create"
      />
    </PageContent>
  );
}
