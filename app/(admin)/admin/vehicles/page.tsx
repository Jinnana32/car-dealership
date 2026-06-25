import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { StatusToast } from "@/components/ui/status-toast";
import { VehicleEmptyState } from "@/features/vehicles/components/vehicle-empty-state";
import { VehicleListPagination } from "@/features/vehicles/components/vehicle-list-pagination";
import { VehicleListTable } from "@/features/vehicles/components/vehicle-list-table";
import { VehicleListToolbar } from "@/features/vehicles/components/vehicle-list-toolbar";
import { getVehiclesList } from "@/features/vehicles/queries";
import {
  getVehicleListFilterSummary,
  vehicleListHasActiveFilters,
} from "@/features/vehicles/utils";
import { canManageVehicles } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type VehiclesPageProps = {
  searchParams: Promise<{
    availability?: string | string[];
    bodyType?: string | string[];
    brand?: string | string[];
    error?: string | string[];
    maxPrice?: string | string[];
    minPrice?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
    search?: string | string[];
    sort?: string | string[];
    status?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VehiclesPage({
  searchParams,
}: VehiclesPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const result = await getVehiclesList(access, resolvedSearchParams);
  const canManage = canManageVehicles(access.membership.role);
  const hasActiveFilters = vehicleListHasActiveFilters(result.filters);
  const filterSummary = getVehicleListFilterSummary(result.filters);
  const showEmptyInventory = result.totalCount === 0 && !hasActiveFilters;
  const showNoResults = result.vehicles.length === 0 && hasActiveFilters;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent title="Vehicles">
        <VehicleListToolbar
          canManage={canManage}
          filterOptions={result.filterOptions}
          filters={result.filters}
        />

        {showEmptyInventory ? (
          <VehicleEmptyState variant="empty" />
        ) : showNoResults ? (
          <VehicleEmptyState filters={result.filters} variant="no-results" />
        ) : (
          <>
            <VehicleListTable canManage={canManage} vehicles={result.vehicles} />
            <VehicleListPagination
              filters={result.filters}
              pageCount={result.pageCount}
              totalCount={result.totalCount}
            />
            {filterSummary.length > 0 ? (
              <p className="px-1 text-sm text-muted-foreground">
                Active filters: {filterSummary.join(" · ")}
              </p>
            ) : null}
          </>
        )}
      </PageContent>
    </>
  );
}
