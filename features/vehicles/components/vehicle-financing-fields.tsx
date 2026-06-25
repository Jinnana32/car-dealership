"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  buildFinancingTermsFromSelection,
  computeDownPaymentFromPercent,
  normalizeVehicleFinancingTerms,
  VEHICLE_FINANCING_DISPLAY_STYLES,
  VEHICLE_FINANCING_DISPLAY_STYLE_LABELS,
  VEHICLE_FINANCING_TERM_YEAR_OPTIONS,
} from "@/features/vehicles/pricing";
import type { Vehicle, VehicleFormState, VehicleFormValues } from "@/features/vehicles/types";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type VehicleFinancingFieldsProps = {
  fieldErrors: VehicleFormState["fieldErrors"];
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

export function VehicleFinancingFields({
  fieldErrors,
  formValues,
  vehicle,
}: VehicleFinancingFieldsProps): ReactElement {
  const initialTermYears = normalizeVehicleFinancingTerms(
    vehicle?.financing_monthly_terms,
  ).map((term) => term.term_years);
  const [financingEnabled, setFinancingEnabled] = useState(
    formValues.financing_enabled === "true",
  );
  const [cashPriceInput, setCashPriceInput] = useState(formValues.price);
  const [downPaymentPercentInput, setDownPaymentPercentInput] = useState(
    formValues.financing_down_payment_percent,
  );
  const [selectedTermYears, setSelectedTermYears] = useState<number[]>(initialTermYears);
  const [customTermYear, setCustomTermYear] = useState("");

  const cashPrice = parseNumericInput(cashPriceInput);
  const downPaymentPercent = parseNumericInput(downPaymentPercentInput);
  const computedDownPayment = useMemo(
    () => computeDownPaymentFromPercent(cashPrice, downPaymentPercent),
    [cashPrice, downPaymentPercent],
  );
  const computedTerms = useMemo(
    () =>
      buildFinancingTermsFromSelection({
        cashPrice,
        downPayment: computedDownPayment,
        selectedTermYears: financingEnabled ? selectedTermYears : [],
      }),
    [cashPrice, computedDownPayment, financingEnabled, selectedTermYears],
  );

  function toggleTermYear(termYear: number): void {
    setSelectedTermYears((current) =>
      current.includes(termYear)
        ? current.filter((year) => year !== termYear)
        : [...current, termYear].sort((left, right) => left - right),
    );
  }

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

        <div className="space-y-2 md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              defaultChecked={formValues.is_price_negotiable === "true"}
              name="is_price_negotiable"
              type="checkbox"
              value="true"
            />
            Price is negotiable
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              defaultChecked={formValues.show_cash_price_in_posts === "true"}
              name="show_cash_price_in_posts"
              type="checkbox"
              value="true"
            />
            Show cash price in Facebook posts
          </label>
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="financing_down_payment_percent">Down payment (%)</Label>
              <Input
                defaultValue={formValues.financing_down_payment_percent}
                id="financing_down_payment_percent"
                inputMode="decimal"
                max={100}
                min={0}
                name="financing_down_payment_percent"
                onChange={(event) => setDownPaymentPercentInput(event.target.value)}
                placeholder="20"
                step="0.01"
              />
              {computedDownPayment !== null ? (
                <p className="text-sm text-muted-foreground">
                  = {formatVehicleCurrency(computedDownPayment)}
                </p>
              ) : null}
              <FieldError message={getFieldError(fieldErrors, "financing_down_payment_percent")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financing_display_style">Post display style</Label>
              <Select
                defaultValue={formValues.financing_display_style}
                id="financing_display_style"
                name="financing_display_style"
              >
                {VEHICLE_FINANCING_DISPLAY_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {VEHICLE_FINANCING_DISPLAY_STYLE_LABELS[style]}
                  </option>
                ))}
              </Select>
              <FieldError message={getFieldError(fieldErrors, "financing_display_style")} />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Financing terms</Label>
            <p className="text-sm text-muted-foreground">
              Select the terms to offer. Monthly payments are estimated from cash price minus
              down payment.
            </p>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_FINANCING_TERM_YEAR_OPTIONS.map((termYear) => {
                const isSelected = selectedTermYears.includes(termYear);

                return (
                  <button
                    key={termYear}
                    className={
                      isSelected
                        ? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                        : "rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground"
                    }
                    onClick={() => toggleTermYear(termYear)}
                    type="button"
                  >
                    {termYear} years
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-2">
                <Label htmlFor="custom_financing_term_year">Other term (years)</Label>
                <Input
                  id="custom_financing_term_year"
                  inputMode="numeric"
                  max={10}
                  min={1}
                  onChange={(event) => setCustomTermYear(event.target.value)}
                  placeholder="6"
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
            {selectedTermYears.map((termYear) => (
              <input
                key={termYear}
                name="financing_term_years"
                type="hidden"
                value={termYear}
              />
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
                  : "Select at least one financing term."}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <input
            name="financing_down_payment_percent"
            type="hidden"
            value={formValues.financing_down_payment_percent}
          />
          <input
            name="financing_display_style"
            type="hidden"
            value={formValues.financing_display_style}
          />
        </>
      )}
    </div>
  );
}
