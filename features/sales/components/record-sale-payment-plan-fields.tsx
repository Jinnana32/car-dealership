"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { CurrencyInput } from "@/components/forms/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { VEHICLE_SALE_PAYMENT_TYPES } from "@/features/sales/constants";
import type { VehicleSalePaymentType } from "@/features/sales/types";
import { getVehicleSalePaymentTypeLabel } from "@/features/sales/utils";
import {
  computeFinancingMonthlyPayment,
  computeFinancingPrincipal,
  computeInstallmentTotal,
  resolveDownPaymentAmount,
  type DownPaymentInputMode,
} from "@/features/vehicles/pricing";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

type RecordSalePaymentPlanFieldsProps = {
  defaultFinancierName?: string;
  defaultPaymentType?: Exclude<VehicleSalePaymentType, null> | "";
  defaultSoldPrice?: number | null;
  financingAprPercent: number;
  idPrefix?: string;
  soldPrice?: number | null;
  soldPriceFieldId?: string;
};

function fieldId(idPrefix: string | undefined, name: string): string {
  return idPrefix ? `${idPrefix}-${name}` : name;
}

function parseNumericInput(value: string): number | null {
  return parseMoneyInput(value);
}

export function RecordSalePaymentPlanFields({
  defaultFinancierName = "In-house",
  defaultPaymentType = "",
  defaultSoldPrice = null,
  financingAprPercent,
  idPrefix,
  soldPrice: soldPriceProp,
  soldPriceFieldId,
}: RecordSalePaymentPlanFieldsProps): ReactElement {
  const [paymentType, setPaymentType] = useState<VehicleSalePaymentType | "">(
    defaultPaymentType,
  );
  const [watchedSoldPrice, setWatchedSoldPrice] = useState<number | null>(defaultSoldPrice);
  const [downPaymentMode, setDownPaymentMode] = useState<DownPaymentInputMode>("amount");
  const [downPaymentValue, setDownPaymentValue] = useState("");
  const [termYears, setTermYears] = useState("");
  const [planTbd, setPlanTbd] = useState(false);
  const usesParentSoldPrice = soldPriceProp !== undefined;
  const effectiveSoldPrice = usesParentSoldPrice ? soldPriceProp : watchedSoldPrice;

  useEffect(() => {
    if (usesParentSoldPrice) {
      return;
    }

    setWatchedSoldPrice(defaultSoldPrice);
  }, [defaultSoldPrice, usesParentSoldPrice]);

  useEffect(() => {
    if (usesParentSoldPrice || !soldPriceFieldId) {
      return;
    }

    const input = document.getElementById(soldPriceFieldId) as HTMLInputElement | null;

    if (!input) {
      return;
    }

    const syncSoldPrice = (): void => {
      const parsed = parseNumericInput(input.value);
      setWatchedSoldPrice(parsed ?? defaultSoldPrice);
    };

    input.addEventListener("input", syncSoldPrice);
    input.addEventListener("change", syncSoldPrice);
    syncSoldPrice();

    return () => {
      input.removeEventListener("input", syncSoldPrice);
      input.removeEventListener("change", syncSoldPrice);
    };
  }, [defaultSoldPrice, soldPriceFieldId, usesParentSoldPrice]);

  const showFinancingFields =
    paymentType === "financing" || paymentType === "other";
  const showTradeInFields =
    paymentType === "trade_in" || paymentType === "other";
  const parsedDownPaymentValue = parseNumericInput(downPaymentValue);
  const parsedTermYears = parseNumericInput(termYears);
  const resolvedDownPayment = useMemo(() => {
    if (effectiveSoldPrice === null || effectiveSoldPrice <= 0) {
      return { amount: null, percent: null };
    }

    return resolveDownPaymentAmount({
      cashPrice: effectiveSoldPrice,
      mode: downPaymentMode,
      value: parsedDownPaymentValue,
    });
  }, [downPaymentMode, effectiveSoldPrice, parsedDownPaymentValue]);
  const computedMonthlyPayment = useMemo(() => {
    if (
      planTbd ||
      effectiveSoldPrice === null ||
      effectiveSoldPrice <= 0 ||
      resolvedDownPayment.amount === null ||
      parsedTermYears === null ||
      !Number.isInteger(parsedTermYears) ||
      parsedTermYears < 1
    ) {
      return null;
    }

    return computeFinancingMonthlyPayment({
      aprPercent: financingAprPercent,
      cashPrice: effectiveSoldPrice,
      downPayment: resolvedDownPayment.amount,
      termYears: parsedTermYears,
    });
  }, [
    effectiveSoldPrice,
    financingAprPercent,
    parsedTermYears,
    planTbd,
    resolvedDownPayment.amount,
  ]);
  const computedTermMonths =
    parsedTermYears !== null && Number.isInteger(parsedTermYears)
      ? parsedTermYears * 12
      : null;
  const financedAmount = useMemo(() => {
    if (
      effectiveSoldPrice === null ||
      effectiveSoldPrice <= 0 ||
      resolvedDownPayment.amount === null
    ) {
      return null;
    }

    return computeFinancingPrincipal({
      cashPrice: effectiveSoldPrice,
      downPayment: resolvedDownPayment.amount,
    });
  }, [effectiveSoldPrice, resolvedDownPayment.amount]);
  const totalInstallmentAmount =
    computedMonthlyPayment !== null && computedTermMonths !== null
      ? computeInstallmentTotal({
          monthlyPayment: computedMonthlyPayment,
          termMonths: computedTermMonths,
        })
      : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={fieldId(idPrefix, "payment_type")}>Payment type</Label>
        <Select
          defaultValue={defaultPaymentType}
          id={fieldId(idPrefix, "payment_type")}
          name="payment_type"
          onChange={(event) => {
            setPaymentType(event.target.value as VehicleSalePaymentType | "");
          }}
        >
          <option value="">Not set</option>
          {VEHICLE_SALE_PAYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {getVehicleSalePaymentTypeLabel(type)}
            </option>
          ))}
        </Select>
      </div>

      {showFinancingFields ? (
        <div className="space-y-4 rounded-2xl border border-border bg-[#fafaf9] p-4">
          <p className="text-sm font-semibold text-foreground">In-house financing</p>
          <p className="text-sm text-muted-foreground">
            Monthly payment includes in-house markup via the dealership APR (
            {financingAprPercent}%).{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/admin/settings">
              Change APR in Settings
            </Link>
            .
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 md:col-span-2">
              <Label htmlFor={fieldId(idPrefix, "down_payment_value")}>Down payment</Label>
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
              {downPaymentMode === "amount" ? (
                <CurrencyInput
                  disabled={planTbd}
                  id={fieldId(idPrefix, "down_payment_value")}
                  name="down_payment_value"
                  onValueChange={(displayValue) => setDownPaymentValue(displayValue)}
                  placeholder="100,000"
                  value={downPaymentValue}
                />
              ) : (
                <Input
                  disabled={planTbd}
                  id={fieldId(idPrefix, "down_payment_value")}
                  inputMode="decimal"
                  min="0"
                  name="down_payment_value"
                  onChange={(event) => setDownPaymentValue(event.target.value)}
                  placeholder="20"
                  value={downPaymentValue}
                />
              )}
              <input
                name="down_payment_input_mode"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor={fieldId(idPrefix, "term_years")}>Term (years)</Label>
              <Input
                disabled={planTbd}
                id={fieldId(idPrefix, "term_years")}
                inputMode="numeric"
                max={10}
                min={1}
                name="term_years"
                onChange={(event) => setTermYears(event.target.value)}
                step="1"
                type="number"
                value={termYears}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={fieldId(idPrefix, "monthly_payment_display")}>
                Monthly payment
              </Label>
              <Input
                disabled
                id={fieldId(idPrefix, "monthly_payment_display")}
                placeholder={
                  effectiveSoldPrice === null || effectiveSoldPrice <= 0
                    ? "Enter sold price first"
                    : "Auto-calculated"
                }
                readOnly
                value={
                  computedMonthlyPayment !== null
                    ? formatMoneyInput(computedMonthlyPayment)
                    : ""
                }
              />
              <input
                name="monthly_payment"
                type="hidden"
                value={computedMonthlyPayment ?? ""}
              />
              <input
                name="down_payment_amount"
                type="hidden"
                value={resolvedDownPayment.amount ?? ""}
              />
              <input
                name="term_months"
                type="hidden"
                value={computedTermMonths ?? ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={fieldId(idPrefix, "financier_name")}>Financier</Label>
              <Input
                defaultValue={defaultFinancierName}
                id={fieldId(idPrefix, "financier_name")}
                name="financier_name"
                placeholder="In-house"
              />
            </div>
          </div>

          {financedAmount !== null ? (
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Financing summary
              </p>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Amount financed</dt>
                  <dd className="font-medium text-foreground">
                    {formatVehicleCurrency(financedAmount)}
                  </dd>
                </div>
                {totalInstallmentAmount !== null && computedTermMonths !== null ? (
                  <div>
                    <dt className="text-muted-foreground">
                      Total installments ({computedTermMonths} mo)
                    </dt>
                    <dd className="font-medium text-foreground">
                      {formatVehicleCurrency(totalInstallmentAmount)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {financingAprPercent <= 0 && totalInstallmentAmount !== null && financedAmount !== null &&
              totalInstallmentAmount > financedAmount ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Installment total is slightly above the financed amount because monthly payments
                  are rounded up.
                </p>
              ) : null}
            </div>
          ) : null}

          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              checked={planTbd}
              className="mt-1"
              name="plan_tbd"
              onChange={(event) => setPlanTbd(event.target.checked)}
              type="checkbox"
              value="true"
            />
            <span>
              Plan details TBD
              <span className="mt-1 block text-muted-foreground">
                Use when financing is confirmed but down payment or term is not finalized yet.
              </span>
            </span>
          </label>
        </div>
      ) : null}

      {showTradeInFields ? (
        <div className="space-y-2 rounded-2xl border border-border bg-[#fafaf9] p-4">
          <Label htmlFor={fieldId(idPrefix, "trade_in_amount")}>Trade-in value</Label>
          <CurrencyInput
            id={fieldId(idPrefix, "trade_in_amount")}
            name="trade_in_amount"
            placeholder="0"
          />
        </div>
      ) : null}

      {paymentType === "cash" ? (
        <p className="text-sm text-muted-foreground">
          Cash sales are recorded as paid in full at closing.
        </p>
      ) : null}
    </div>
  );
}
