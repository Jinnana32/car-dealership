import type { ReactElement, ReactNode } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { CurrencyInput } from "@/components/forms/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSalePaymentPlan } from "@/features/sales/actions";
import { SalePaymentPlanStatusBadge } from "@/features/sales/components/sale-payment-plan-status-badge";
import type { SaleLedgerSummary, SalePaymentPlan } from "@/features/sales/types";
import {
  getSalePaymentPlanTypeLabel,
} from "@/features/sales/utils";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type SalePaymentPlanSectionProps = {
  canEditPlan: boolean;
  ledgerSummary: SaleLedgerSummary;
  paymentPlan: SalePaymentPlan | null;
  redirectTo: string;
  saleId: string;
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

export function SalePaymentPlanSection({
  canEditPlan,
  ledgerSummary,
  paymentPlan,
  redirectTo,
  saleId,
}: SalePaymentPlanSectionProps): ReactElement {
  if (!paymentPlan) {
    return (
      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Payment plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No payment plan is linked to this sale yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const canEdit =
    canEditPlan &&
    (paymentPlan.plan_type === "financing" || paymentPlan.plan_type === "mixed");
  const planIsTbd =
    paymentPlan.status === "pending" &&
    paymentPlan.term_months === null &&
    paymentPlan.plan_type === "financing";

  return (
    <Card className="rounded-[20px] border-border shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-2">
          <CardTitle className="text-lg">Payment plan</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SalePaymentPlanStatusBadge status={paymentPlan.status} />
            <span className="text-sm text-muted-foreground">
              {getSalePaymentPlanTypeLabel(paymentPlan.plan_type)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <DetailField
            label="Total amount"
            value={formatVehicleCurrency(paymentPlan.total_amount)}
          />
          <DetailField
            label="Balance remaining"
            value={
              <span className="font-semibold">
                {formatVehicleCurrency(ledgerSummary.balanceRemaining)}
              </span>
            }
          />
          <DetailField
            label="Paid to date"
            value={formatVehicleCurrency(ledgerSummary.paidToDate)}
          />
          <DetailField
            label="Down payment"
            value={formatVehicleCurrency(paymentPlan.down_payment_amount)}
          />
          {paymentPlan.trade_in_amount !== null ? (
            <DetailField
              label="Trade-in value"
              value={formatVehicleCurrency(paymentPlan.trade_in_amount)}
            />
          ) : null}
          {paymentPlan.financed_amount !== null ? (
            <DetailField
              label="Financed amount"
              value={formatVehicleCurrency(paymentPlan.financed_amount)}
            />
          ) : null}
          {paymentPlan.term_months !== null ? (
            <DetailField label="Term" value={`${paymentPlan.term_months} months`} />
          ) : null}
          {paymentPlan.monthly_payment !== null ? (
            <DetailField
              label="Monthly payment"
              value={formatVehicleCurrency(paymentPlan.monthly_payment)}
            />
          ) : null}
          {paymentPlan.financier_name ? (
            <DetailField label="Financier" value={paymentPlan.financier_name} />
          ) : null}
        </div>

        {planIsTbd ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Financing plan details are still marked as TBD.
          </p>
        ) : null}

        {canEdit ? (
          <details className="rounded-2xl border border-border bg-white px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              Update payment plan
            </summary>

            <form action={updateSalePaymentPlan} className="mt-4 space-y-4">
              <input name="plan_id" type="hidden" value={paymentPlan.id} />
              <input name="redirect_to" type="hidden" value={redirectTo} />
              <input name="sale_id" type="hidden" value={saleId} />
              <input name="total_amount" type="hidden" value={paymentPlan.total_amount} />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`plan-${saleId}-down-payment`}>Down payment</Label>
                  <CurrencyInput
                    defaultValue={paymentPlan.down_payment_amount}
                    id={`plan-${saleId}-down-payment`}
                    name="down_payment_amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`plan-${saleId}-term`}>Term (months)</Label>
                  <Input
                    defaultValue={paymentPlan.term_months ?? ""}
                    id={`plan-${saleId}-term`}
                    min="1"
                    name="term_months"
                    step="1"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`plan-${saleId}-monthly`}>Monthly payment</Label>
                  <CurrencyInput
                    defaultValue={paymentPlan.monthly_payment ?? ""}
                    id={`plan-${saleId}-monthly`}
                    name="monthly_payment"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`plan-${saleId}-financier`}>Financier</Label>
                  <Input
                    defaultValue={paymentPlan.financier_name ?? ""}
                    id={`plan-${saleId}-financier`}
                    name="financier_name"
                  />
                </div>
                {paymentPlan.trade_in_amount !== null ? (
                  <div className="space-y-2">
                    <Label htmlFor={`plan-${saleId}-trade-in`}>Trade-in value</Label>
                    <CurrencyInput
                      defaultValue={paymentPlan.trade_in_amount}
                      id={`plan-${saleId}-trade-in`}
                      name="trade_in_amount"
                    />
                  </div>
                ) : null}
              </div>

              <label className="flex items-start gap-3 text-sm text-foreground">
                <input
                  className="mt-1"
                  defaultChecked={planIsTbd}
                  name="plan_tbd"
                  type="checkbox"
                  value="true"
                />
                <span>Plan details TBD</span>
              </label>

              <SubmitButton type="submit">Save payment plan</SubmitButton>
            </form>
          </details>
        ) : null}

        {!canEdit && paymentPlan.plan_type === "cash" ? (
          <p className="text-sm text-muted-foreground">
            Cash sales are tracked as paid in full at closing.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
