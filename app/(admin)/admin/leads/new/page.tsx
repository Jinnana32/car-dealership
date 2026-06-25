import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { ManualLeadForm } from "@/features/inquiries/components/manual-lead-form";
import {
  getDealershipMemberOptions,
  getVehicleOptions,
} from "@/features/inquiries/queries";
import { getCustomerById } from "@/features/customers/queries";
import { getAdminAccessContext } from "@/lib/auth/session";

type NewLeadPageProps = {
  searchParams: Promise<{
    customerId?: string | string[];
  }>;
};

export default async function NewLeadPage({
  searchParams,
}: NewLeadPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const customerId = Array.isArray(resolvedSearchParams.customerId)
    ? resolvedSearchParams.customerId[0]
    : resolvedSearchParams.customerId;
  const [memberOptions, vehicleOptions, preselectedCustomerResult] =
    await Promise.all([
      getDealershipMemberOptions(access),
      getVehicleOptions(access),
      customerId ? getCustomerById(access, customerId) : Promise.resolve(null),
    ]);

  const preselectedCustomer =
    preselectedCustomerResult && preselectedCustomerResult.type === "ok"
      ? preselectedCustomerResult.record.customer
      : null;

  return (
    <PageContent title="Add Lead" description="Create a manual customer inquiry.">
      <ManualLeadForm
        memberOptions={memberOptions}
        preselectedCustomer={preselectedCustomer}
        vehicleOptions={vehicleOptions}
      />
    </PageContent>
  );
}
