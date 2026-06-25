import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { StatusToast } from "@/components/ui/status-toast";
import { SaleDetailView } from "@/features/sales/components/sale-detail-view";
import { SaleNotFoundState } from "@/features/sales/components/sale-not-found-state";
import { getSaleById } from "@/features/sales/queries";
import { canManageDealership, canViewSales } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type SaleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SaleDetailPage({
  params,
  searchParams,
}: SaleDetailPageProps): Promise<ReactElement | null> {
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

  const { id } = await params;
  const result = await getSaleById(access, id);
  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);

  if (result.type === "forbidden") {
    return (
      <UnauthorizedState
        title="Sale access denied"
        description="This sale is not available to the current account."
      />
    );
  }

  if (result.type === "not_found") {
    return <SaleNotFoundState />;
  }

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />
      <SaleDetailView
        canEditPlan={canManageDealership(access.membership.role)}
        canManageOverpayment={canManageDealership(access.membership.role)}
        ledger={result.ledger}
        paymentPlan={result.paymentPlan}
        record={result.record}
      />
    </>
  );
}
