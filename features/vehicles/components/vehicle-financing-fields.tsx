"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildFinancingTermsFromSelection,
  inferDownPaymentPercent,
  normalizeVehicleFinancingTerms,
  resolveDownPaymentAmount,
  type DownPaymentInputMode,
} from "@/features/vehicles/pricing";
import type { Vehicle, VehicleFormState, VehicleFormValues } from "@/features/vehicles/types";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type VehicleFinancingFieldsProps = {
  fieldErrors: VehicleFormState["fieldErrors"];
  financingAprPercent: number;
  formValues: VehicleFormValues;
  vehicle?: Vehicle;
};

function getFieldError(
  fieldErrors: VehicleFormState["fieldErrors"],
  fieldName: string,
): string | undefined {
  return fieldErrors?.[fieldName]?.[0];
}

function FieldError({
  message,
}: {
  message?: string;
}): ReactElement | null {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

function parseNumericInput(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function getInitialDownPaymentMode(vehicle?: Vehicle): DownPaymentInputMode {
  if (
    vehicle?.financing_down_payment_percent !== null &&
    vehicle?.financing_down_payment_percent !== undefined &&
    vehicle.financing_down_payment === null
  ) {
    return "percent";
  }

  if (vehicle?.financing_down_payment !== null && vehicle?.financing_down_payment !== undefined) {
    return "amount";
  }

  return "percent";
}

function getInitialDownPaymentValue(
  formValues: VehicleFormValues,
  vehicle?: Vehicle,
  mode?: DownPaymentInputMode,
): string {
  if (formValues.financing_down_payment_value) {
    return formValues.financing_down_payment_value;
  }

  const resolvedMode = mode ?? getInitialDownPaymentMode(vehicle);

  if (
    resolvedMode === "amount" &&
    vehicle?.financing_down_payment !== null &&
    vehicle?.financing_down_payment !== undefined
  ) {
    return String(vehicle.financing_down_payment);
  }

  const percent = inferDownPaymentPercent({
    cashPrice: vehicle?.price ?? null,
    downPaymentAmount: vehicle?.financing_down_payment ?? null,
    downPaymentPercent: vehicle?.financing_down_payment_percent ?? null,
  });

  return percent !== null ? String(percent) : "";
}

export function VehicleFinancingFields({
  fieldErrors,
  financingAprPercent,
  formValues,
  vehicle,
}: VehicleFinancingFieldsProps): ReactElement {
  const initialTermYears = normalizeVehicleFinancingTerms(
    vehicle?.financing_monthly_terms,
  ).map((term) => term.term_years);
  const initialDownPaymentMode =
    formValues.financing_down_payment_mode === "amount" ||
    formValues.financing_down_payment_mode === "percent"
      ? formValues.financing_down_payment_mode
      : getInitialDownPaymentMode(vehicle);
  const [financingEnabled, setFinancingEnabled] = useState(
    formValues.financing_enabled === "true",
  );
  const [cashPriceInput, setCashPriceInput] = useState(formValues.price);
  const [downPaymentMode, setDownPaymentMode] = useState<DownPaymentInputMode>(
    initialDownPaymentMode,
  );
  const [downPaymentValue, setDownPaymentValue] = useState(
    getInitialDownPaymentValue(formValues, vehicle, initialDownPaymentMode),
  );
  const [selectedTermYears, setSelectedTermYears] = useState<number[]>(initialTermYears);
  const [customTermYear, setCustomTermYear] = useState("");

  const cashPrice = parseNumericInput(cashPriceInput);
  const parsedDownPaymentValue = parseNumericInput(downPaymentValue);
  const resolvedDownPayment = useMemo(
    () =>
      resolveDownPaymentAmount({
        cashPrice,
        mode: downPaymentMode,
        value: parsedDownPaymentValue,
      }),
    [cashPrice, downPaymentMode, parsedDownPaymentValue],
  );
  const computedTerms = useMemo(
    () =>
      buildFinancingTermsFromSelection({
        aprPercent: financingAprPercent,
        cashPrice,
        downPayment: resolvedDownPayment.amount,
        selectedTermYears: financingEnabled ? selectedTermYears : [],
      }),
    [cashPrice, financingAprPercent, financingEnabled, resolvedDownPayment.amount, selectedTermYears],
  );

  function addCustomTermYear(): void {
    const parsedYear = Number.parseInt(customTermYear, 10);

    if (!Number.isInteger(parsedYear) || parsedYear < 1 || parsedYear > 10) {
      return;
    }

    setSelectedTermYears((current) =>
      current.includes(parsedYear)
        ? current
        : [...current, parsedYear].sort((left, right) => left - right),
    );
    setCustomTermYear("");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Cash price</Label>
          <Input
            defaultValue={formValues.price}
            id="price"
            inputMode="decimal"
            name="price"
            onChange={(event) => setCashPriceInput(event.target.value)}
            placeholder="0.00"
          />
          <FieldError message={getFieldError(fieldErrors, "price")} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          checked={financingEnabled}
          name="financing_enabled"
          onChange={(event) => setFinancingEnabled(event.target.checked)}
          type="checkbox"
          value="true"
        />
        Enable financing for this vehicle
      </label>

      {financingEnabled ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="financing_down_payment_value">Down payment</Label>
            <div className="flex flex-wrap gap-2">
              <button
                className={
                  downPaymentMode === "amount"
                    ? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                    : "rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground"
                }
                onClick={() => setDownPaymentMode("amount")}
                type="button"
              >
                Fixed amount
              </button>
              <button
                className={
                  downPaymentMode === "percent"
                    ? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                    : "rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground"
                }
                onClick={() => setDownPaymentMode("percent")}
                type="button"
              >
                Percent
              </button>
            </div>
            <Input
              id="financing_down_payment_value"
              inputMode="decimal"
              min="0"
              name="financing_down_payment_value"
              onChange={(event) => setDownPaymentValue(event.target.value)}
              placeholder={downPaymentMode === "percent" ? "20" : "100000"}
              value={downPaymentValue}
            />
            <input
              name="financing_down_payment_mode"
              type="hidden"
              value={downPaymentMode}
            />
            {resolvedDownPayment.amount !== null ? (
              <p className="text-sm text-muted-foreground">
                {downPaymentMode === "percent" && resolvedDownPayment.percent !== null
                  ? `${resolvedDownPayment.percent}% = ${formatVehicleCurrency(resolvedDownPayment.amount)}`
                  : resolvedDownPayment.percent !== null
                    ? `${formatVehicleCurrency(resolvedDownPayment.amount)} (${resolvedDownPayment.percent}%)`
                    : formatVehicleCurrency(resolvedDownPayment.amount)}
              </p>
            ) : null}
            <FieldError message={getFieldError(fieldErrors, "financing_down_payment_value")} />
          </div>

          <div className="space-y-3">
            <Label>Financing terms (years)</Label>
            <p className="text-sm text-muted-foreground">
              Add each term to advertise. Monthly payments include in-house markup at{" "}
              {financingAprPercent}% APR. Facebook posts show cash price and monthly only.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-2">
                <Label htmlFor="custom_financing_term_year">Term (years)</Label>
                <Input
                  id="custom_financing_term_year"
                  inputMode="numeric"
                  max={10}
                  min={1}
                  onChange={(event) => setCustomTermYear(event.target.value)}
                  placeholder="5"
                  value={customTermYear}
                />
              </div>
              <button
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-foreground"
                onClick={addCustomTermYear}
                type="button"
              >
                Add term
              </button>
            </div>
            {selectedTermYears.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedTermYears.map((termYear) => (
                  <button
                    key={termYear}
                    className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground"
                    onClick={() =>
                      setSelectedTermYears((current) =>
                        current.filter((year) => year !== termYear),
                      )
                    }
                    type="button"
                  >
                    {termYear} years ×
                  </button>
                ))}
              </div>
            ) : null}
            {selectedTermYears.map((termYear) => (
              <input key={termYear} name="financing_term_years" type="hidden" value={termYear} />
            ))}
            <FieldError message={getFieldError(fieldErrors, "financing_monthly_terms")} />
          </div>

          <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Estimated monthly payments
            </p>
            {computedTerms.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {computedTerms.map((term) => (
                  <li key={term.term_years} className="text-sm text-foreground">
                    {term.term_years} years — {formatVehicleCurrency(term.monthly_payment)}/mo
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {cashPrice === null
                  ? "Enter a cash price to calculate monthly payments."
                  : "Add at least one financing term."}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <input
            name="financing_down_payment_mode"
            type="hidden"
            value={formValues.financing_down_payment_mode || "percent"}
          />
          <input
            name="financing_down_payment_value"
            type="hidden"
            value={formValues.financing_down_payment_value}
          />
        </>
      )}
    </div>
  );
}
