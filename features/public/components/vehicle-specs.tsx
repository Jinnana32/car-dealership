import type { ReactElement } from "react";

import type { PublicVehicle } from "@/features/public/types";
import { formatVehicleMileage } from "@/features/vehicles/utils";
import { cn } from "@/lib/utils";

type VehicleSpecsProps = {
  className?: string;
  compact?: boolean;
  vehicle: PublicVehicle;
};

function getVehicleSpecPairs(vehicle: PublicVehicle): Array<[string, string]> {
  return [
    ["Year", vehicle.year ? String(vehicle.year) : "Not set"],
    ["Transmission", vehicle.transmission ?? "Not set"],
    ["Fuel type", vehicle.fuel_type ?? "Not set"],
    ["Mileage", formatVehicleMileage(vehicle.mileage)],
    ["Body type", vehicle.body_type ?? "Not set"],
    ["Color", vehicle.color ?? "Not set"],
  ];
}

export function VehicleSpecs({
  className,
  compact = false,
  vehicle,
}: VehicleSpecsProps): ReactElement {
  const specPairs = getVehicleSpecPairs(vehicle);

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {specPairs.slice(0, 4).map(([label, value]) => (
          <span
            key={label}
            className="rounded-full border border-border bg-[#faf8f4] px-3 py-1.5 text-xs font-medium text-foreground"
          >
            {label}: {value}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {specPairs.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-border bg-white px-4 py-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}
