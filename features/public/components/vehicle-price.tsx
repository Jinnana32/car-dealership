import type { ReactElement } from "react";

import {
  formatVehicleDownPaymentDisplay,
  normalizeVehicleFinancingTerms,
  type VehicleFinancingTerm,
} from "@/features/vehicles/pricing";
import type { Vehicle } from "@/features/vehicles/types";
import {
  formatVehicleCurrency,
  formatVehicleCurrencyCompact,
} from "@/features/vehicles/utils";
import { cn } from "@/lib/utils";

type VehiclePriceProps = {
  className?: string;
  price: number | null;
  size?: "detail" | "list";
  vehicle?: Pick<
    Vehicle,
    | "financing_down_payment"
    | "financing_down_payment_percent"
    | "financing_enabled"
    | "financing_monthly_terms"
    | "financing_notes"
    | "is_price_negotiable"
    | "price"
  >;
};

function getLowestMonthlyTerm(
  terms: VehicleFinancingTerm[],
): VehicleFinancingTerm | null {
  if (terms.length === 0) {
    return null;
  }

  return [...terms].sort(
    (left, right) => left.monthly_payment - right.monthly_payment,
  )[0];
}

export function VehiclePrice({
  className,
  price,
  size = "list",
  vehicle,
}: VehiclePriceProps): ReactElement {
  const financingTerms = vehicle
    ? normalizeVehicleFinancingTerms(vehicle.financing_monthly_terms)
    : [];
  const lowestMonthlyTerm = getLowestMonthlyTerm(financingTerms);
  const showFinancing =
    vehicle?.financing_enabled &&
    (lowestMonthlyTerm !== null ||
      vehicle.financing_down_payment !== null ||
      Boolean(vehicle.financing_notes?.trim()));

  return (
    <div className={cn("space-y-1", className)}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {showFinancing && price === null ? "Financing" : "Price"}
        </p>
        <p
          className={
            size === "detail"
              ? "text-3xl font-semibold tracking-tight text-foreground"
              : "text-xl font-semibold tracking-tight text-foreground"
          }
        >
          {price !== null ? formatVehicleCurrency(price) : "Contact for pricing"}
        </p>
        {vehicle?.is_price_negotiable ? (
          <p className="text-sm text-muted-foreground">Negotiable for serious buyers</p>
        ) : null}
      </div>

      {showFinancing ? (
        <div className="mt-4 space-y-2 rounded-2xl border border-border bg-[#fafaf9] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Financing
          </p>
          {vehicle.financing_down_payment !== null ||
          vehicle.financing_down_payment_percent !== null ? (
            <p className="text-sm text-foreground">
              Down payment from{" "}
              {formatVehicleDownPaymentDisplay({
                cashPrice: vehicle.price ?? price,
                downPaymentAmount: vehicle.financing_down_payment,
                downPaymentPercent: vehicle.financing_down_payment_percent,
                formatCurrency: formatVehicleCurrency,
              })}
            </p>
          ) : null}
          {lowestMonthlyTerm ? (
            <p className="text-sm font-medium text-foreground">
              From {formatVehicleCurrencyCompact(lowestMonthlyTerm.monthly_payment)}/month
              {" · "}
              {lowestMonthlyTerm.term_years} years
            </p>
          ) : null}
          {vehicle.financing_notes?.trim() ? (
            <p className="text-sm text-muted-foreground">{vehicle.financing_notes}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
