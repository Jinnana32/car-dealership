"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { CurrencyInput } from "@/components/forms/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RecordSalePaymentPlanFields } from "@/features/sales/components/record-sale-payment-plan-fields";
import { recordQuickSale } from "@/features/sales/actions";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money";

type QuickSaleFormProps = {
  defaultFinancierName: string;
  financingAprPercent: number;
  vehicleOptions: Array<{ id: string; label: string; price: number | null }>;
};

export function QuickSaleForm({
  defaultFinancierName,
  financingAprPercent,
  vehicleOptions,
}: QuickSaleFormProps): ReactElement {
  const [vehicleId, setVehicleId] = useState("");
  const [soldPriceInput, setSoldPriceInput] = useState("");

  const selectedVehicle = useMemo(
    () => vehicleOptions.find((option) => option.id === vehicleId) ?? null,
    [vehicleId, vehicleOptions],
  );
  const soldPrice = useMemo(() => {
    const parsed = parseMoneyInput(soldPriceInput);

    return parsed !== null && parsed > 0 ? parsed : null;
  }, [soldPriceInput]);

  useEffect(() => {
    setSoldPriceInput(
      selectedVehicle?.price !== null && selectedVehicle?.price !== undefined
        ? formatMoneyInput(selectedVehicle.price)
        : "",
    );
  }, [selectedVehicle]);

  function handleVehicleChange(event: FormEvent<HTMLSelectElement>): void {
    setVehicleId(event.currentTarget.value);
  }

  return (
    <form action={recordQuickSale} className="space-y-6 rounded-[20px] border border-border bg-white p-5">
      <input name="confirm" type="hidden" value="quick_sale" />
      <input name="redirect_to" type="hidden" value="/admin/sales/new" />

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Customer</h2>
        <p className="text-sm text-muted-foreground">
          Capture who bought the vehicle. A customer and walk-in inquiry are created automatically.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quick-sale-customer-name">Customer name</Label>
          <Input id="quick-sale-customer-name" name="customer_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quick-sale-phone">Phone</Label>
          <Input id="quick-sale-phone" name="phone" required type="tel" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="quick-sale-email">Email</Label>
          <Input id="quick-sale-email" name="email" type="email" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Vehicle & price</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="quick-sale-vehicle">Vehicle</Label>
          <Select
            id="quick-sale-vehicle"
            name="vehicle_id"
            onChange={handleVehicleChange}
            required
            value={vehicleId}
          >
            <option value="">Select a vehicle</option>
            {vehicleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
                {option.price !== null ? ` · ${formatVehicleCurrency(option.price)}` : ""}
              </option>
            ))}
          </Select>
        </div>

        {selectedVehicle?.price !== null && selectedVehicle?.price !== undefined ? (
          <input name="asking_price" type="hidden" value={selectedVehicle.price} />
        ) : (
          <input name="asking_price" type="hidden" value="" />
        )}

        <div className="space-y-2">
          <Label htmlFor="quick-sale-sold-price">Sold price</Label>
          <CurrencyInput
            id="quick-sale-sold-price"
            name="sold_price"
            onValueChange={(displayValue) => setSoldPriceInput(displayValue)}
            required
            value={soldPriceInput}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quick-sale-sold-at">Sold date</Label>
          <Input
            defaultValue={new Date().toISOString().slice(0, 16)}
            id="quick-sale-sold-at"
            name="sold_at"
            required
            type="datetime-local"
          />
        </div>
      </div>

      <RecordSalePaymentPlanFields
        defaultFinancierName={defaultFinancierName}
        defaultPaymentType="cash"
        financingAprPercent={financingAprPercent}
        idPrefix="quick-sale"
        soldPrice={soldPrice}
      />

      <div className="space-y-2">
        <Label htmlFor="quick-sale-notes">Notes</Label>
        <Textarea id="quick-sale-notes" name="notes" placeholder="Optional sale notes" rows={3} />
      </div>

      <ConfirmSubmitButton
        confirmMessage="Record this walk-in sale and mark the vehicle as sold?"
        type="submit"
      >
        Record walk-in sale
      </ConfirmSubmitButton>
    </form>
  );
}
