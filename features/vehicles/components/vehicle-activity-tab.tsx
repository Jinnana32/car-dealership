import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateVehicleAvailability, updateVehicleStatus } from "@/features/vehicles/actions";
import {
  VEHICLE_AVAILABILITIES,
  VEHICLE_DETAIL_CONTENT_NARROW_CLASS,
  VEHICLE_STATUSES,
} from "@/features/vehicles/constants";
import type { Vehicle } from "@/features/vehicles/types";
import {
  buildVehicleDetailPath,
  formatVehicleDateTime,
  getVehicleAvailabilityLabel,
  getVehicleStatusLabel,
} from "@/features/vehicles/utils";

type VehicleActivityTabProps = {
  canManage: boolean;
  vehicle: Vehicle;
};

export function VehicleActivityTab({
  canManage,
  vehicle,
}: VehicleActivityTabProps): ReactElement {
  const activityPath = buildVehicleDetailPath(vehicle.id, "activity");

  return (
    <div className={VEHICLE_DETAIL_CONTENT_NARROW_CLASS}>
      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Publishing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form action={updateVehicleStatus} className="space-y-2">
            <input name="redirect_to" type="hidden" value={activityPath} />
            <input name="vehicle_id" type="hidden" value={vehicle.id} />
            <Label htmlFor="status">Status</Label>
            <div className="flex gap-2">
              <Select
                defaultValue={vehicle.status}
                disabled={!canManage}
                id="status"
                name="status"
              >
                {VEHICLE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getVehicleStatusLabel(status)}
                  </option>
                ))}
              </Select>
              {canManage ? (
                <SubmitButton pendingLabel="Saving..." size="sm" type="submit">
                  Save
                </SubmitButton>
              ) : null}
            </div>
          </form>

          <form action={updateVehicleAvailability} className="space-y-2">
            <input name="redirect_to" type="hidden" value={activityPath} />
            <input name="vehicle_id" type="hidden" value={vehicle.id} />
            <Label htmlFor="availability">Availability</Label>
            <div className="flex gap-2">
              <Select
                defaultValue={vehicle.availability}
                disabled={!canManage}
                id="availability"
                name="availability"
              >
                {VEHICLE_AVAILABILITIES.map((availability) => (
                  <option key={availability} value={availability}>
                    {getVehicleAvailabilityLabel(availability)}
                  </option>
                ))}
              </Select>
              {canManage ? (
                <SubmitButton pendingLabel="Saving..." size="sm" type="submit">
                  Save
                </SubmitButton>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Internal metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="overflow-hidden rounded-2xl border border-border">
            {[
              ["Slug", vehicle.slug],
              ["Created", formatVehicleDateTime(vehicle.created_at)],
              ["Updated", formatVehicleDateTime(vehicle.updated_at)],
              ["Vehicle ID", vehicle.id],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={
                  index === 0
                    ? "grid gap-1 px-4 py-3 sm:grid-cols-[140px_minmax(0,1fr)]"
                    : "grid gap-1 border-t border-border px-4 py-3 sm:grid-cols-[140px_minmax(0,1fr)]"
                }
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </dt>
                <dd className="break-all text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
