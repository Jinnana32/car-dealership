import Link from "next/link";
import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { StatusToast } from "@/components/ui/status-toast";
import { getDealershipMemberOptions, getVehicleOptions } from "@/features/inquiries/queries";
import { SalesEmptyState } from "@/features/sales/components/sales-empty-state";
import { SalesFilters } from "@/features/sales/components/sales-filters";
import { SalesListTable } from "@/features/sales/components/sales-list-table";
import { SalesSummaryBar } from "@/features/sales/components/sales-summary-bar";
import { getSalesCollectionsSummary, getSalesList } from "@/features/sales/queries";
import { canRecordSales, canViewReports, canViewSales } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type SalesPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    from?: string | string[];
    paymentType?: string | string[];
    search?: string | string[];
    soldById?: string | string[];
    success?: string | string[];
    to?: string | string[];
    vehicleId?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SalesPage({
  searchParams,
}: SalesPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canViewSales(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Sales access denied"
        description="Your account does not have permission to view closed deals."
      />
    );
  }

  const resolvedSearchParams = await searchParams;
  const [result, collections, vehicleOptions, memberOptions] = await Promise.all([
    getSalesList(access, resolvedSearchParams),
    getSalesCollectionsSummary(access),
    getVehicleOptions(access),
    getDealershipMemberOptions(access),
  ]);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const paymentsExportHref = canViewReports(access.membership.role)
    ? "/api/reports/sale-payments.csv"
    : null;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Sales"
        actions={
          <>
            {canRecordSales(access.membership.role) ? (
              <Button asChild>
                <Link href="/admin/sales/new">Walk-in sale</Link>
              </Button>
            ) : null}
            {paymentsExportHref ? (
              <Button asChild variant="outline">
                <Link href={paymentsExportHref}>Export payments</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/admin/reports/sales">Sales report</Link>
            </Button>
          </>
        }
      >
        <SalesFilters
          filters={result.filters}
          memberOptions={memberOptions}
          vehicleOptions={vehicleOptions}
        />

        {result.sales.length === 0 ? (
          <SalesEmptyState />
        ) : (
          <>
            <SalesSummaryBar
              collections={collections}
              showingCount={result.sales.length}
              summary={result.summary}
              totalCount={result.totalCount}
            />
            <SalesListTable sales={result.sales} />
          </>
        )}
      </PageContent>
    </>
  );
}
