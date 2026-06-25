import type { ReactElement } from "react";

import { getVehicleBrochureExports } from "@/features/brochures/queries";
import {
  getVehicleDetailSearchParam,
  VehicleDetailToasts,
} from "@/features/vehicles/components/vehicle-detail-toasts";
import { VehicleMarketingTab } from "@/features/vehicles/components/vehicle-marketing-tab";
import { getVehicleFacebookContext } from "@/features/facebook/queries";
import { getVehicleDetailPageContext } from "@/features/vehicles/queries";
import {
  canCreateFacebookContent,
  canGenerateBrochures,
  canPublishToFacebookPage,
} from "@/lib/auth/permissions";

type VehicleMarketingPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

export default async function VehicleMarketingPage({
  params,
  searchParams,
}: VehicleMarketingPageProps): Promise<ReactElement | null> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const context = await getVehicleDetailPageContext(id);

  if (context.type !== "ok") {
    return null;
  }

  const [brochureExports, facebookContext] = await Promise.all([
    getVehicleBrochureExports(context.access, context.record.vehicle.id),
    getVehicleFacebookContext({
      access: context.access,
      hasFeaturedImage:
        context.record.media.some((item) => item.is_featured) ||
        context.record.media.length > 0,
      vehicle: context.record.vehicle,
    }),
  ]);

  return (
    <>
      <VehicleDetailToasts
        error={getVehicleDetailSearchParam(resolvedSearchParams.error)}
        success={getVehicleDetailSearchParam(resolvedSearchParams.success)}
      />
      <VehicleMarketingTab
        brochureExports={brochureExports}
        canGenerateBrochures={canGenerateBrochures(context.access.membership.role)}
        canGenerateFacebookContent={canCreateFacebookContent(context.access.membership.role)}
        canPublishToFacebook={canPublishToFacebookPage(context.access.membership.role)}
        dealershipSlug={context.access.dealership.slug}
        facebookContext={facebookContext}
        media={context.record.media}
        vehicle={context.record.vehicle}
      />
    </>
  );
}
