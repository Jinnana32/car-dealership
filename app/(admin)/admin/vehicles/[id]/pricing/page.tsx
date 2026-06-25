import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { buildVehicleDetailPath } from "@/features/vehicles/utils";

type VehiclePricingRedirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VehiclePricingRedirectPage({
  params,
}: VehiclePricingRedirectPageProps): Promise<ReactElement> {
  const { id } = await params;

  redirect(buildVehicleDetailPath(id, "overview"));
}
