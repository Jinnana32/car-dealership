import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import type { PublicVehicleCardRecord } from "@/features/public/types";
import { VehiclePrice } from "@/features/public/components/vehicle-price";
import { VehicleSpecs } from "@/features/public/components/vehicle-specs";

type VehicleCardProps = {
  dealerSlug: string;
  vehicle: PublicVehicleCardRecord;
};

export function VehicleCard({
  dealerSlug,
  vehicle,
}: VehicleCardProps): ReactElement {
  return (
    <article className="overflow-hidden rounded-[24px] border border-border bg-white shadow-sm">
      <VehicleImage
        alt={vehicle.title}
        className="aspect-[4/3] w-full rounded-none border-0"
        src={vehicle.featuredImage}
      />
      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {[vehicle.year, vehicle.brand, vehicle.model].filter(Boolean).join(" • ")}
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {vehicle.title}
          </h2>
        </div>

        <VehiclePrice price={vehicle.price} />
        <VehicleSpecs compact vehicle={vehicle} />

        <Button asChild className="w-full">
          <Link href={`/${dealerSlug}/vehicles/${vehicle.slug}`}>View details</Link>
        </Button>
      </div>
    </article>
  );
}
