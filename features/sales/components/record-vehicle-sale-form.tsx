"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordVehicleSaleInPanel } from "@/features/sales/actions";
import { RecordSalePaymentPlanFields } from "@/features/sales/components/record-sale-payment-plan-fields";
import { RecordSalePriceFields } from "@/features/sales/components/record-sale-price-fields";
import type {
  RecordVehicleSaleFormState,
  VehicleSalePaymentType,
} from "@/features/sales/types";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type RecordVehicleSaleFormProps = {
  askingPrice: number | null;
  budgetRange?: string | null;
  customerId: string;
  customerName: string;
  defaultFinancierName: string;
  financingAprPercent: number;
  inquiryId: string;
  listPrice: number | null;
  onSuccess?: () => void;
  redirectTo: string;
  vehicleId: string;
  vehicleTitle: string;
};

const initialState: RecordVehicleSaleFormState = {
  fieldErrors: {},
};

function fieldId(inquiryId: string, name: string): string {
  return `${inquiryId}-${name}`;
}

function getFieldError(
  state: RecordVehicleSaleFormState,
  field: string,
): string | undefined {
  return state.fieldErrors?.[field]?.[0];
}

function FieldError({
  message,
}: {
  message: string | undefined;
}): ReactElement | null {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

function getSummaryMessages(state: RecordVehicleSaleFormState): string[] {
  if (state.formErrors && state.formErrors.length > 0) {
    return state.formErrors;
  }

  return Array.from(
    new Set(
      Object.values(state.fieldErrors ?? {})
        .flat()
        .filter((message): message is string => Boolean(message)),
    ),
  );
}

export function RecordVehicleSaleForm({
  askingPrice,
  budgetRange,
  customerId,
  customerName,
  defaultFinancierName,
  financingAprPercent,
  inquiryId,
  listPrice,
  onSuccess,
  redirectTo,
  vehicleId,
  vehicleTitle,
}: RecordVehicleSaleFormProps): ReactElement {
  const router = useRouter();
  const handledSuccessRef = useRef(false);
  const [state, formAction] = useActionState(recordVehicleSaleInPanel, initialState);
  const values = state.values;
  const formKey = values ? JSON.stringify(values) : inquiryId;
  const summaryMessages = getSummaryMessages(state);
  const soldPriceDefault =
    values?.sold_price ||
    (listPrice !== null ? String(listPrice) : "");
  const soldAtDefault =
    values?.sold_at || new Date().toISOString().slice(0, 16);
  const paymentTypeDefault = (values?.payment_type ||
    "") as Exclude<VehicleSalePaymentType, null> | "";

  useEffect(() => {
    if (!state.success) {
      handledSuccessRef.current = false;
      return;
    }

    if (handledSuccessRef.current) {
      return;
    }

    handledSuccessRef.current = true;
    router.refresh();
    onSuccess?.();
  }, [onSuccess, router, state.success]);

  return (
    <form action={formAction} className="space-y-4" key={formKey}>
      <input name="asking_price" type="hidden" value={values?.asking_price ?? askingPrice ?? ""} />
      <input name="confirm" type="hidden" value="record_sale" />
      <input name="customer_id" type="hidden" value={customerId} />
      <input name="inquiry_id" type="hidden" value={inquiryId} />
      <input name="redirect_to" type="hidden" value={redirectTo} />
      <input name="vehicle_id" type="hidden" value={vehicleId} />

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{state.error}</p>
          {summaryMessages.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {summaryMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {state.success && state.message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4 text-sm text-foreground">
        <p className="font-semibold">Mark as Won / Record Sale</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Vehicle
            </p>
            <p className="mt-1">{vehicleTitle}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Customer
            </p>
            <p className="mt-1">{customerName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Inquiry
            </p>
            <p className="mt-1">{inquiryId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              List price
            </p>
            <p className="mt-1 font-medium text-foreground">
              {formatVehicleCurrency(listPrice)}
            </p>
          </div>
          {!listPrice && budgetRange ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Budget (inquiry)
              </p>
              <p className="mt-1">{budgetRange}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <RecordSalePriceFields
          defaultSoldAt={soldAtDefault}
          defaultSoldPrice={soldPriceDefault}
          formKey={inquiryId}
          listPrice={listPrice}
          soldAtFieldId={fieldId(inquiryId, "sold_at")}
          soldPriceFieldId={fieldId(inquiryId, "sold_price")}
        />
        <FieldError message={getFieldError(state, "sold_price")} />
        <FieldError message={getFieldError(state, "sold_at")} />

        <RecordSalePaymentPlanFields
          defaultFinancierName={defaultFinancierName}
          defaultPaymentType={paymentTypeDefault}
          defaultSoldPrice={listPrice}
          financingAprPercent={financingAprPercent}
          idPrefix={inquiryId}
          soldPriceFieldId={fieldId(inquiryId, "sold_price")}
        />
        <FieldError message={getFieldError(state, "payment_type")} />
        <FieldError message={getFieldError(state, "down_payment_value")} />
        <FieldError message={getFieldError(state, "term_years")} />

        <div className="space-y-2">
          <Label htmlFor={fieldId(inquiryId, "sale_notes")}>Notes</Label>
          <Textarea
            defaultValue={values?.notes ?? ""}
            id={fieldId(inquiryId, "sale_notes")}
            name="notes"
            placeholder="Optional sale context"
            rows={4}
          />
        </div>
      </div>

      <ConfirmSubmitButton
        confirmMessage="Record this sale and mark the inquiry as won?"
        pendingLabel="Recording sale..."
        type="submit"
      >
        Record Sale
      </ConfirmSubmitButton>
    </form>
  );
}
