import Link from "next/link";
import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { StatusToast } from "@/components/ui/status-toast";
import { VehicleForm } from "@/features/vehicles/components/vehicle-form";
import { getDealershipVehicleCatalog } from "@/features/vehicles/catalog";
import { VehicleNotFoundState } from "@/features/vehicles/components/vehicle-not-found-state";
import { getVehicleById } from "@/features/vehicles/queries";
import { canManageVehicles } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type EditVehiclePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditVehiclePage({
  params,
  searchParams,
}: EditVehiclePageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canManageVehicles(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Vehicle management access required"
        description="Only owners and admins can edit vehicles."
      />
    );
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const result = await getVehicleById(access, id);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);

  if (result.type === "forbidden") {
    return (
      <UnauthorizedState
        title="Vehicle access denied"
        description="This vehicle belongs to a different dealership or is not available to the current account."
      />
    );
  }

  if (result.type === "not_found") {
    return <VehicleNotFoundState />;
  }

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Edit Vehicle"
        description={result.record.vehicle.title}
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/vehicles/${result.record.vehicle.id}`}>
              View Vehicle
            </Link>
          </Button>
        }
      >
        <VehicleForm
          catalog={getDealershipVehicleCatalog(access.dealership.vehicle_catalog)}
          financingAprPercent={access.dealership.default_financing_apr_percent}
          mode="edit"
          vehicle={result.record.vehicle}
        />
      </PageContent>
    </>
  );
}
