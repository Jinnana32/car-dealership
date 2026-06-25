"use client";

import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateVehicleMarketingSettings } from "@/features/vehicles/actions";
import {
  VEHICLE_FINANCING_DISPLAY_STYLES,
  VEHICLE_FINANCING_DISPLAY_STYLE_LABELS,
} from "@/features/vehicles/pricing";
import type { Vehicle } from "@/features/vehicles/types";

type VehicleMarketingSettingsFormProps = {
  redirectPath: string;
  vehicle: Vehicle;
};

export function VehicleMarketingSettingsForm({
  redirectPath,
  vehicle,
}: VehicleMarketingSettingsFormProps): ReactElement {
  const updateAction = updateVehicleMarketingSettings.bind(null, vehicle.id);

  return (
    <Card className="rounded-[20px] border-border shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Marketing and post settings</CardTitle>
        <p className="text-sm text-muted-foreground">
          Control how this vehicle appears in Facebook posts and buyer-facing marketing.
        </p>
      </CardHeader>
      <CardContent>
        <form action={updateAction} className="space-y-4">
          <input name="redirect_to" type="hidden" value={redirectPath} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="condition_summary">Condition summary</Label>
              <Input
                defaultValue={vehicle.condition_summary ?? ""}
                id="condition_summary"
                name="condition_summary"
                placeholder="Almost brand new"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financing_display_style">Post display style</Label>
              <Select
                defaultValue={vehicle.financing_display_style}
                id="financing_display_style"
                name="financing_display_style"
              >
                {VEHICLE_FINANCING_DISPLAY_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {VEHICLE_FINANCING_DISPLAY_STYLE_LABELS[style]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-[#fafaf9] p-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                defaultChecked={vehicle.is_price_negotiable}
                name="is_price_negotiable"
                type="checkbox"
                value="true"
              />
              Price is negotiable
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                defaultChecked={vehicle.show_cash_price_in_posts}
                name="show_cash_price_in_posts"
                type="checkbox"
                value="true"
              />
              Show cash price in Facebook posts
            </label>
          </div>

          <SubmitButton pendingLabel="Saving..." size="sm">
            Save marketing settings
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
