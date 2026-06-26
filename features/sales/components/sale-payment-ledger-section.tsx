import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { CurrencyInput } from "@/components/forms/currency-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { recordSalePayment, voidSalePayment } from "@/features/sales/actions";
import { SALE_PAYMENT_METHOD_OPTIONS } from "@/features/sales/constants";
import type {
  SaleLedgerContext,
  SalePaymentPlan,
  SalePaymentRecord,
  SalePaymentScheduleItem,
} from "@/features/sales/types";
import { getSalePaymentMethodLabel } from "@/features/sales/utils";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { cn } from "@/lib/utils";

type SalePaymentLedgerSectionProps = {
  canManageOverpayment: boolean;
  ledger: SaleLedgerContext;
  paymentPlan: SalePaymentPlan | null;
  redirectTo: string;
  saleId: string;
};

function PaymentTimelineItem({
  payment,
  redirectTo,
  saleId,
  canVoid,
}: {
  canVoid: boolean;
  payment: SalePaymentRecord;
  redirectTo: string;
  saleId: string;
}): ReactElement {
  const isVoided = payment.status === "voided";

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4",
        isVoided
          ? "border-border bg-muted/20 text-muted-foreground"
          : "border-border bg-[#fafaf9]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {formatVehicleCurrency(payment.amount)}
            {isVoided ? (
              <Badge className="ml-2" variant="outline">
                Voided
              </Badge>
            ) : null}
          </p>
          <p className="text-sm text-muted-foreground">
            {getSalePaymentMethodLabel(payment.payment_method)}
            {payment.reference_number ? ` · Ref ${payment.reference_number}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCrmDateTime(payment.paid_at)} · {payment.recordedByName ?? "Team member"}
          </p>
          {payment.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{payment.notes}</p>
          ) : null}
        </div>

        {canVoid && !isVoided ? (
          <form action={voidSalePayment} className="space-y-2">
            <input name="payment_id" type="hidden" value={payment.id} />
            <input name="redirect_to" type="hidden" value={redirectTo} />
            <input name="sale_id" type="hidden" value={saleId} />
            <Label className="sr-only" htmlFor={`void-note-${payment.id}`}>
              Void note
            </Label>
            <Input
              id={`void-note-${payment.id}`}
              name="void_note"
              placeholder="Void reason"
            />
            <ConfirmSubmitButton
              confirmMessage="Void this payment and recalculate the balance?"
              size="sm"
              type="submit"
              variant="outline"
            >
              Void
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function ScheduleItemRow({ item }: { item: SalePaymentScheduleItem }): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm">
      <div>
        <p className="font-medium text-foreground">{formatCrmDateTime(item.due_at)}</p>
        <p className="text-muted-foreground">{formatVehicleCurrency(item.amount_due)} due</p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          item.status === "overdue" && "border-amber-200 bg-amber-50 text-amber-700",
          item.status === "paid" && "border-emerald-200 bg-emerald-50 text-emerald-700",
          item.status === "pending" && "border-zinc-200 bg-zinc-100 text-zinc-700",
        )}
      >
        {item.status}
      </Badge>
    </div>
  );
}

export function SalePaymentLedgerSection({
  canManageOverpayment,
  ledger,
  paymentPlan,
  redirectTo,
  saleId,
}: SalePaymentLedgerSectionProps): ReactElement {
  const showRecordForm = ledger.canRecordPayment && paymentPlan;

  return (
    <Card className="rounded-[20px] border-border shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">Payment ledger</CardTitle>
        {paymentPlan ? (
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Paid to date{" "}
              <span className="font-semibold text-foreground">
                {formatVehicleCurrency(ledger.summary.paidToDate)}
              </span>
            </span>
            <span>
              Balance remaining{" "}
              <span className="font-semibold text-foreground">
                {formatVehicleCurrency(ledger.summary.balanceRemaining)}
              </span>
            </span>
            {ledger.summary.hasOverdueSchedule ? (
              <span className="font-medium text-amber-700">Installment overdue</span>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {showRecordForm ? (
          <form action={recordSalePayment} className="space-y-4 rounded-2xl border border-border bg-[#fafaf9] p-4">
            <input name="plan_id" type="hidden" value={paymentPlan.id} />
            <input name="redirect_to" type="hidden" value={redirectTo} />
            <input name="sale_id" type="hidden" value={saleId} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`payment-amount-${saleId}`}>Amount</Label>
                <CurrencyInput
                  id={`payment-amount-${saleId}`}
                  name="amount"
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`payment-date-${saleId}`}>Paid at</Label>
                <Input
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  id={`payment-date-${saleId}`}
                  name="paid_at"
                  required
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`payment-method-${saleId}`}>Payment method</Label>
                <Select
                  defaultValue="cash"
                  id={`payment-method-${saleId}`}
                  name="payment_method"
                  required
                >
                  {SALE_PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`payment-reference-${saleId}`}>Reference number</Label>
                <Input
                  id={`payment-reference-${saleId}`}
                  name="reference_number"
                  placeholder="GCash ref, check no., etc."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`payment-notes-${saleId}`}>Notes</Label>
                <Textarea id={`payment-notes-${saleId}`} name="notes" rows={3} />
              </div>
            </div>

            {canManageOverpayment ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input className="mt-1" name="allow_overpayment" type="checkbox" value="true" />
                  <span>Allow overpayment (admin override)</span>
                </label>
                <div className="space-y-2">
                  <Label htmlFor={`payment-override-${saleId}`}>Override note</Label>
                  <Input
                    id={`payment-override-${saleId}`}
                    name="override_note"
                    placeholder="Required when recording above the remaining balance"
                  />
                </div>
              </div>
            ) : null}

            <SubmitButton type="submit">Record payment</SubmitButton>
          </form>
        ) : null}

        {ledger.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ledger payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {ledger.payments.map((payment) => (
              <PaymentTimelineItem
                key={payment.id}
                canVoid={ledger.canVoidPayments}
                payment={payment}
                redirectTo={redirectTo}
                saleId={saleId}
              />
            ))}
          </div>
        )}

        {ledger.scheduleItems.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Installment schedule</p>
            <div className="space-y-2">
              {ledger.scheduleItems.map((item) => (
                <ScheduleItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
