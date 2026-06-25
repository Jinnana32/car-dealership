import type { ReactElement, ReactNode } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { VehicleDetailShell } from "@/features/vehicles/components/vehicle-detail-shell";
import { VehicleNotFoundState } from "@/features/vehicles/components/vehicle-not-found-state";
import { getVehicleDetailPageContext } from "@/features/vehicles/queries";
import { canManageVehicles } from "@/lib/auth/permissions";

type VehicleDetailLayoutProps = {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export default async function VehicleDetailLayout({
  children,
  params,
}: VehicleDetailLayoutProps): Promise<ReactElement | null> {
  const { id } = await params;
  const context = await getVehicleDetailPageContext(id);

  if (context.type === "unauthenticated") {
    return null;
  }

  if (context.type === "forbidden") {
    return (
      <UnauthorizedState
        description="This vehicle belongs to a different dealership or is not available to the current account."
        title="Vehicle access denied"
      />
    );
  }

  if (context.type === "not_found") {
    return <VehicleNotFoundState />;
  }

  return (
    <VehicleDetailShell
      canManage={canManageVehicles(context.access.membership.role)}
      media={context.record.media}
      vehicle={context.record.vehicle}
    >
      {children}
    </VehicleDetailShell>
  );
}
