import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { StatusToast } from "@/components/ui/status-toast";
import { CustomerDetailView } from "@/features/customers/components/customer-detail-view";
import { CustomerNotFoundState } from "@/features/customers/components/customer-not-found-state";
import { getCustomerById } from "@/features/customers/queries";
import { canCreateLeads } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type CustomerDetailPageProps = {
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

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const { id } = await params;
  const result = await getCustomerById(access, id);
  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);

  if (result.type === "forbidden") {
    return (
      <UnauthorizedState
        title="Customer access denied"
        description="This customer belongs to a different dealership or is not available to the current account."
      />
    );
  }

  if (result.type === "not_found") {
    return <CustomerNotFoundState />;
  }

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />
      <CustomerDetailView
        canEdit={canCreateLeads(access.membership.role)}
        record={result.record}
      />
    </>
  );
}
