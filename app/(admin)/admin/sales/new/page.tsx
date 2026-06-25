import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { PageContent } from "@/components/layout/page-content";
import { StatusToast } from "@/components/ui/status-toast";
import { QuickSaleForm } from "@/features/sales/components/quick-sale-form";
import { getAvailableVehicleSaleOptions } from "@/features/sales/queries";
import { canRecordSales } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type QuickSalePageProps = {
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function QuickSalePage({
  searchParams,
}: QuickSalePageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canRecordSales(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Walk-in sale access denied"
        description="Your account does not have permission to record sales."
      />
    );
  }

  const vehicleOptions = await getAvailableVehicleSaleOptions(access);
  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Walk-in sale"
        description="Record a same-day purchase without adding a lead first."
      >
        {vehicleOptions.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-[#fafaf9] px-4 py-8 text-sm text-muted-foreground">
            No available vehicles to sell right now. Add inventory or mark an unsold vehicle
            available first.
          </div>
        ) : (
          <QuickSaleForm
            defaultFinancierName={access.dealership.name}
            financingAprPercent={access.dealership.default_financing_apr_percent}
            vehicleOptions={vehicleOptions}
          />
        )}
      </PageContent>
    </>
  );
}
