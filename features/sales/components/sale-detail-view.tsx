import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { formatCrmDate, formatCrmDateTime } from "@/features/inquiries/utils";
import { SalePaymentLedgerSection } from "@/features/sales/components/sale-payment-ledger-section";
import { SalePaymentPlanSection } from "@/features/sales/components/sale-payment-plan-section";
import type { SaleLedgerContext, SalePaymentPlan, VehicleSaleRecord } from "@/features/sales/types";
import { getVehicleSalePaymentTypeLabel } from "@/features/sales/utils";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type SaleDetailViewProps = {
  canEditPlan: boolean;
  canManageOverpayment: boolean;
  ledger: SaleLedgerContext;
  paymentPlan: SalePaymentPlan | null;
  record: VehicleSaleRecord;
};

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}): ReactElement {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

export function SaleDetailView({
  canEditPlan,
  canManageOverpayment,
  ledger,
  paymentPlan,
  record,
}: SaleDetailViewProps): ReactElement {
  const title = record.vehicle?.title ?? "Closed deal";
  const redirectTo = `/admin/sales/${record.id}`;

  return (
    <PageContent
      title={title}
      actions={
        <Button asChild variant="outline">
          <Link href="/admin/sales">Back to sales</Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Deal summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <DetailField
                label="Sold price"
                value={
                  <span className="text-lg font-semibold">
                    {formatVehicleCurrency(record.sold_price)}
                  </span>
                }
              />
              <DetailField
                label="Asking price"
                value={formatVehicleCurrency(record.asking_price)}
              />
              <DetailField
                label="Sold date"
                value={formatCrmDate(record.sold_at)}
              />
              <DetailField
                label="Payment type"
                value={getVehicleSalePaymentTypeLabel(record.payment_type)}
              />
              <DetailField
                label="Vehicle"
                value={
                  record.vehicle ? (
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/admin/vehicles/${record.vehicle.id}`}
                    >
                      {record.vehicle.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Not linked</span>
                  )
                }
              />
              <DetailField
                label="Customer"
                value={
                  record.customer ? (
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/admin/customers/${record.customer.id}`}
                    >
                      {record.customer.full_name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Not linked</span>
                  )
                }
              />
            </CardContent>
          </Card>

          <SalePaymentPlanSection
            canEditPlan={canEditPlan}
            ledgerSummary={ledger.summary}
            paymentPlan={paymentPlan}
            redirectTo={redirectTo}
            saleId={record.id}
          />

          <SalePaymentLedgerSection
            canManageOverpayment={canManageOverpayment}
            ledger={ledger}
            paymentPlan={paymentPlan}
            redirectTo={redirectTo}
            saleId={record.id}
          />

          {record.notes ? (
            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-foreground">{record.notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Related records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {record.inquiry ? (
                <div className="space-y-2 rounded-2xl border border-border bg-[#fafaf9] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <InquirySourceBadge sourceType={record.inquiry.source_type} />
                    <InquiryStatusBadge status={record.inquiry.status} />
                  </div>
                  <Button asChild className="w-full" size="sm" variant="outline">
                    <Link href={`/admin/inquiries/${record.inquiry.id}`}>Open inquiry</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No inquiry linked to this sale.</p>
              )}

              {record.vehicle ? (
                <Button asChild className="w-full" size="sm" variant="outline">
                  <Link href={`/admin/vehicles/${record.vehicle.id}/sales`}>
                    Vehicle sales tab
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Record info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailField
                label="Recorded by"
                value={record.createdByName ?? "Team member"}
              />
              <DetailField
                label="Recorded at"
                value={formatCrmDateTime(record.created_at)}
              />
              <DetailField label="Sale ID" value={<span className="font-mono text-xs">{record.id}</span>} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContent>
  );
}
