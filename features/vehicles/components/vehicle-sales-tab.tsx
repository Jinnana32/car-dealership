import Link from "next/link";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { RecordSalePaymentPlanFields } from "@/features/sales/components/record-sale-payment-plan-fields";
import { SalePaymentPlanStatusBadge } from "@/features/sales/components/sale-payment-plan-status-badge";
import { recordVehicleSale } from "@/features/sales/actions";
import type { VehicleSalesContext } from "@/features/sales/types";
import { getVehicleSalePaymentTypeLabel } from "@/features/sales/utils";
import { VEHICLE_DETAIL_CONTENT_NARROW_CLASS } from "@/features/vehicles/constants";
import type { Vehicle } from "@/features/vehicles/types";
import { buildVehicleDetailPath, formatVehicleCurrency, formatVehicleDateTime } from "@/features/vehicles/utils";

type VehicleSalesTabProps = {
  canManage: boolean;
  canRecordSale: boolean;
  defaultFinancierName: string;
  financingAprPercent: number;
  salesContext: VehicleSalesContext;
  vehicle: Vehicle;
};

export function VehicleSalesTab({
  canManage,
  canRecordSale,
  defaultFinancierName,
  financingAprPercent,
  salesContext,
  vehicle,
}: VehicleSalesTabProps): ReactElement {
  const salesPath = buildVehicleDetailPath(vehicle.id, "sales");

  return (
    <div className={VEHICLE_DETAIL_CONTENT_NARROW_CLASS}>
      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Sale status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {salesContext.sale ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              <p className="font-semibold">Sale recorded</p>
              <p className="mt-1">
                Sold for {formatVehicleCurrency(salesContext.sale.sold_price)} on{" "}
                {formatVehicleDateTime(salesContext.sale.sold_at)}.
              </p>
              <p className="mt-1">
                Payment type: {getVehicleSalePaymentTypeLabel(salesContext.sale.payment_type)}
              </p>
              {salesContext.paymentPlan ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SalePaymentPlanStatusBadge status={salesContext.paymentPlan.status} />
                  <span>
                    Balance: {formatVehicleCurrency(salesContext.paymentPlan.balance_remaining)}
                  </span>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/sales/${salesContext.sale.id}`}>Open sale</Link>
                </Button>
                {salesContext.sale.customer ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/customers/${salesContext.sale.customer.id}`}>
                      Open customer
                    </Link>
                  </Button>
                ) : null}
                {salesContext.sale.inquiry ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/inquiries/${salesContext.sale.inquiry.id}`}>
                      Open inquiry
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4 text-sm text-muted-foreground">
              No sale recorded for this vehicle yet.
            </div>
          )}

          {canRecordSale && !salesContext.sale ? (
            <details className="rounded-2xl border border-border bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                Record sale
              </summary>

              <form action={recordVehicleSale} className="mt-4 space-y-4">
                <input name="asking_price" type="hidden" value={vehicle.price ?? ""} />
                <input name="confirm" type="hidden" value="record_sale" />
                <input name="redirect_to" type="hidden" value={salesPath} />
                <input name="vehicle_id" type="hidden" value={vehicle.id} />

                {!canManage ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Sales agents can record a sale only when the selected inquiry is assigned to
                    them.
                  </div>
                ) : null}

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_customer_id">Customer</Label>
                    <Select defaultValue="" id="sale_customer_id" name="customer_id">
                      <option value="">No customer selected</option>
                      {salesContext.customerOptions.map((customerOption) => (
                        <option key={customerOption.id} value={customerOption.id}>
                          {customerOption.full_name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_inquiry_id">Related inquiry</Label>
                    <Select defaultValue="" id="sale_inquiry_id" name="inquiry_id">
                      <option value="">No inquiry selected</option>
                      {salesContext.relatedInquiries.map((relatedInquiry) => (
                        <option key={relatedInquiry.id} value={relatedInquiry.id}>
                          {relatedInquiry.customerName} · {relatedInquiry.status}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-sold-price">Sold price</Label>
                      <Input
                        defaultValue={vehicle.price ?? ""}
                        id="vehicle-sold-price"
                        name="sold_price"
                        required
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-sold-at">Sold date</Label>
                      <Input
                        defaultValue={new Date().toISOString().slice(0, 16)}
                        id="vehicle-sold-at"
                        name="sold_at"
                        required
                        type="datetime-local"
                      />
                    </div>
                  </div>

                  <RecordSalePaymentPlanFields
                    defaultFinancierName={defaultFinancierName}
                    defaultSoldPrice={vehicle.price}
                    financingAprPercent={financingAprPercent}
                    idPrefix="vehicle-sale"
                    soldPriceFieldId="vehicle-sold-price"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="vehicle-sale-notes">Notes</Label>
                    <Textarea id="vehicle-sale-notes" name="notes" rows={4} />
                  </div>
                </div>

                <ConfirmSubmitButton
                  confirmMessage="Record this sale and mark the vehicle as sold?"
                  type="submit"
                >
                  Record sale
                </ConfirmSubmitButton>
              </form>
            </details>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Related inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          {salesContext.relatedInquiries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-6 text-sm text-muted-foreground">
              No inquiries linked to this vehicle yet.
            </div>
          ) : (
            <div className="space-y-2">
              {salesContext.relatedInquiries.map((relatedInquiry) => (
                <Link
                  key={relatedInquiry.id}
                  className="block rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 transition-colors hover:bg-muted/30"
                  href={`/admin/inquiries/${relatedInquiry.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {relatedInquiry.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">{relatedInquiry.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <InquirySourceBadge sourceType={relatedInquiry.sourceType} />
                      <InquiryStatusBadge status={relatedInquiry.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
