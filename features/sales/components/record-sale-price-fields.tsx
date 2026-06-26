import type { ReactElement } from "react";

import { CurrencyInput } from "@/components/forms/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type RecordSalePriceFieldsProps = {
  defaultSoldAt?: string;
  defaultSoldPrice?: number | string | null;
  formKey: string;
  listPrice: number | null;
  soldAtFieldId: string;
  soldPriceFieldId: string;
};

export function RecordSalePriceFields({
  defaultSoldAt,
  defaultSoldPrice,
  formKey,
  listPrice,
  soldAtFieldId,
  soldPriceFieldId,
}: RecordSalePriceFieldsProps): ReactElement {
  const soldPriceValue =
    defaultSoldPrice !== undefined && defaultSoldPrice !== null && defaultSoldPrice !== ""
      ? defaultSoldPrice
      : (listPrice ?? "");
  const soldAtValue = defaultSoldAt ?? new Date().toISOString().slice(0, 16);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>List price</Label>
        <p className="rounded-2xl border border-border bg-[#fafaf9] px-3 py-2.5 text-sm font-medium text-foreground">
          {formatVehicleCurrency(listPrice)}
        </p>
        <p className="text-xs text-muted-foreground">
          {listPrice !== null
            ? "From the vehicle inventory record."
            : "No list price on this vehicle. Enter the agreed sold amount below."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={soldPriceFieldId}>Sold price</Label>
        <CurrencyInput
          key={`${formKey}-sold-price-${String(soldPriceValue)}`}
          defaultValue={soldPriceValue}
          id={soldPriceFieldId}
          name="sold_price"
          placeholder="Enter agreed sale amount"
          required
        />
        {listPrice !== null ? (
          <p className="text-xs text-muted-foreground">
            Pre-filled from list price. Adjust if the deal was negotiated.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={soldAtFieldId}>Sold date</Label>
        <Input
          key={`${formKey}-sold-at-${soldAtValue}`}
          defaultValue={soldAtValue}
          id={soldAtFieldId}
          name="sold_at"
          required
          type="datetime-local"
        />
      </div>
    </div>
  );
}
