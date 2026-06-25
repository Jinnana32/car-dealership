import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { StatusToast } from "@/components/ui/status-toast";
import { InquiryDetailView } from "@/features/inquiries/components/inquiry-detail-view";
import { InquiryNotFoundState } from "@/features/inquiries/components/inquiry-not-found-state";
import {
  getDealershipMemberOptions,
  getInquiryById,
  getVehicleOptions,
} from "@/features/inquiries/queries";
import { getVehicleSaleRecordByInquiryId } from "@/features/sales/queries";
import {
  canAssignInquiries as canAssignInquiryPermissions,
  canManageInquiryRecord as canManageInquiryPermissions,
  canRecordSales,
} from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type InquiryDetailPageProps = {
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

export default async function InquiryDetailPage({
  params,
  searchParams,
}: InquiryDetailPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [result, memberOptions, vehicleOptions] = await Promise.all([
    getInquiryById(access, id),
    getDealershipMemberOptions(access),
    getVehicleOptions(access),
  ]);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);

  if (result.type === "forbidden") {
    return (
      <UnauthorizedState
        title="Inquiry access denied"
        description="This inquiry belongs to a different dealership or is not available to the current account."
      />
    );
  }

  if (result.type === "not_found") {
    return <InquiryNotFoundState />;
  }

  const saleRecord = await getVehicleSaleRecordByInquiryId(
    access,
    result.record.inquiry.id,
  );

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />
      <InquiryDetailView
        canAssignInquiries={canAssignInquiryPermissions(access.membership.role)}
        canManageInquiry={canManageInquiryPermissions(
          access.membership.role,
          access.profile.id,
          result.record.inquiry.assigned_to,
        )}
        canRecordSale={canRecordSales(access.membership.role)}
        memberOptions={memberOptions}
        record={result.record}
        saleRecord={saleRecord}
        vehicleOptions={vehicleOptions}
      />
    </>
  );
}
