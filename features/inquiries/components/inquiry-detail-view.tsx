import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import {
  InquiryDetailHeaderActions,
  InquiryDetailPanels,
} from "@/features/inquiries/components/inquiry-detail-panels";
import type {
  DealershipMemberOption,
  InquiryRecord,
  VehicleOption,
} from "@/features/inquiries/types";
import type { VehicleSaleRecord } from "@/features/sales/types";

type InquiryDetailViewProps = {
  canAssignInquiries: boolean;
  canManageInquiry: boolean;
  canRecordSale: boolean;
  defaultFinancierName: string;
  financingAprPercent: number;
  memberOptions: DealershipMemberOption[];
  record: InquiryRecord;
  saleRecord: VehicleSaleRecord | null;
  vehicleOptions: VehicleOption[];
};

export function InquiryDetailView({
  canAssignInquiries,
  canManageInquiry,
  canRecordSale,
  defaultFinancierName,
  financingAprPercent,
  memberOptions,
  record,
  saleRecord,
  vehicleOptions,
}: InquiryDetailViewProps): ReactElement {
  const redirectTo = `/admin/inquiries/${record.inquiry.id}`;

  return (
    <PageContent
      title={record.customer.full_name}
      description="Inquiry details"
      actions={
        <InquiryDetailHeaderActions
          customerId={record.customer.id}
          inquiryId={record.inquiry.id}
          record={record}
        />
      }
    >
      <InquiryDetailPanels
        canAssignInquiries={canAssignInquiries}
        canManageInquiry={canManageInquiry}
        canRecordSale={canRecordSale}
        defaultFinancierName={defaultFinancierName}
        financingAprPercent={financingAprPercent}
        layout="page"
        memberOptions={memberOptions}
        record={record}
        redirectTo={redirectTo}
        saleRecord={saleRecord}
        vehicleOptions={vehicleOptions}
      />
    </PageContent>
  );
}
