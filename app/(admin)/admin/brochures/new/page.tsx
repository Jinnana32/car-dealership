import Link from "next/link";
import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { StatusToast } from "@/components/ui/status-toast";
import { BrochureGeneratorWorkspace } from "@/features/brochures/components/brochure-generator-workspace";
import { getBrochureGeneratorData } from "@/features/brochures/queries";
import { mapBrochureVehicleToPickerVehicle } from "@/features/brochures/utils";
import { getAdminAccessContext } from "@/lib/auth/session";

type NewBrochurePageProps = {
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewBrochurePage({
  searchParams,
}: NewBrochurePageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const generatorData = await getBrochureGeneratorData(access);
  const pickerVehicles = generatorData.vehicles.map(mapBrochureVehicleToPickerVehicle);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Create Brochure"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/brochures">Brochure History</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/vehicles">Vehicles</Link>
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Public listing QR codes require published, available vehicles and a
          configured `NEXT_PUBLIC_SITE_URL`.
        </p>

        {pickerVehicles.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              No vehicles available
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add vehicles to inventory before generating a brochure.
            </p>
          </div>
        ) : (
          <BrochureGeneratorWorkspace vehicles={pickerVehicles} />
        )}
      </PageContent>
    </>
  );
}
