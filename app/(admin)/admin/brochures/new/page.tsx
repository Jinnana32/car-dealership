import Link from "next/link";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/ui/status-toast";
import { generateMultiVehicleBrochure, generateSingleVehicleBrochure } from "@/features/brochures/actions";
import { getBrochureGeneratorData } from "@/features/brochures/queries";
import { VehicleAvailabilityBadge } from "@/features/vehicles/components/vehicle-availability-badge";
import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import {
  formatVehicleCurrency,
  getVehicleSummaryLine,
} from "@/features/vehicles/utils";
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

function BooleanSelect({
  defaultValue = "true",
  id,
  label,
  name,
}: {
  defaultValue?: "false" | "true";
  id: string;
  label: string;
  name: string;
}): ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select defaultValue={defaultValue} id={id} name={name}>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </Select>
    </div>
  );
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

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Create Brochure"
        description="Generate a downloadable PDF for one vehicle or a curated vehicle selection."
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
        <div className="rounded-[20px] border border-border bg-[#fafaf9] px-4 py-4 text-sm text-muted-foreground">
          Public listing links and QR codes are included only when a vehicle is published, available, and `NEXT_PUBLIC_SITE_URL` is configured.
        </div>

        {generatorData.vehicles.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              No vehicles available
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add vehicles to inventory before generating a brochure.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 2xl:grid-cols-2">
            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Single Vehicle Brochure</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose one vehicle and generate a focused one-unit PDF.
                </p>
              </CardHeader>
              <CardContent>
                <form action={generateSingleVehicleBrochure} className="space-y-5">
                  <input name="redirect_to" type="hidden" value="/admin/brochures/new" />

                  <div className="space-y-2">
                    <Label htmlFor="single-title">Title</Label>
                    <Input
                      id="single-title"
                      name="title"
                      placeholder="Optional brochure title"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Select vehicle</Label>
                    <div className="space-y-3">
                      {generatorData.vehicles.map((vehicle) => (
                        <label
                          key={`single-${vehicle.id}`}
                          className="flex cursor-pointer gap-4 rounded-2xl border border-border bg-white px-4 py-4 transition-colors hover:border-primary/30"
                        >
                          <input
                            className="mt-1 h-4 w-4 accent-[var(--primary)]"
                            name="vehicle_id"
                            required
                            type="radio"
                            value={vehicle.id}
                          />
                          <VehicleImage
                            alt={vehicle.title}
                            className="aspect-[4/3] w-[96px] shrink-0"
                            src={vehicle.featuredMedia?.signedUrl ?? null}
                          />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{vehicle.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {getVehicleSummaryLine(vehicle)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <VehicleStatusBadge status={vehicle.status} />
                              <VehicleAvailabilityBadge availability={vehicle.availability} />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {formatVehicleCurrency(vehicle.price)}
                            </p>
                            {vehicle.status !== "published" ||
                            vehicle.availability !== "available" ? (
                              <p className="text-xs text-amber-700">
                                Public listing link and QR code may be omitted for this vehicle.
                              </p>
                            ) : null}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <BooleanSelect
                      id="single-include-price"
                      label="Include price"
                      name="include_price"
                    />
                    <BooleanSelect
                      id="single-include-qr"
                      label="Include QR code"
                      name="include_qr_code"
                    />
                    <BooleanSelect
                      id="single-include-contact"
                      label="Include contact details"
                      name="include_contact_details"
                    />
                    <BooleanSelect
                      id="single-include-disclaimer"
                      label="Include disclaimer"
                      name="include_disclaimer"
                    />
                  </div>

                  <SubmitButton pendingLabel="Generating..." type="submit">
                    Generate Single Vehicle Brochure
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Multi-Vehicle Brochure</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select at least two vehicles to create a shareable selection PDF.
                </p>
              </CardHeader>
              <CardContent>
                <form action={generateMultiVehicleBrochure} className="space-y-5">
                  <input name="redirect_to" type="hidden" value="/admin/brochures/new" />

                  <div className="space-y-2">
                    <Label htmlFor="multi-title">Title</Label>
                    <Input
                      id="multi-title"
                      name="title"
                      placeholder="Optional brochure title"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Select vehicles</Label>
                    <div className="space-y-3">
                      {generatorData.vehicles.map((vehicle) => (
                        <label
                          key={`multi-${vehicle.id}`}
                          className="flex cursor-pointer gap-4 rounded-2xl border border-border bg-white px-4 py-4 transition-colors hover:border-primary/30"
                        >
                          <input
                            className="mt-1 h-4 w-4 accent-[var(--primary)]"
                            name="vehicle_ids"
                            type="checkbox"
                            value={vehicle.id}
                          />
                          <VehicleImage
                            alt={vehicle.title}
                            className="aspect-[4/3] w-[96px] shrink-0"
                            src={vehicle.featuredMedia?.signedUrl ?? null}
                          />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">{vehicle.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {getVehicleSummaryLine(vehicle)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <VehicleStatusBadge status={vehicle.status} />
                              <VehicleAvailabilityBadge availability={vehicle.availability} />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {formatVehicleCurrency(vehicle.price)}
                            </p>
                            {vehicle.status !== "published" ||
                            vehicle.availability !== "available" ? (
                              <p className="text-xs text-amber-700">
                                Public listing link and QR code may be omitted for this vehicle.
                              </p>
                            ) : null}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <BooleanSelect
                      id="multi-include-price"
                      label="Include price"
                      name="include_price"
                    />
                    <BooleanSelect
                      id="multi-include-qr"
                      label="Include QR code"
                      name="include_qr_code"
                    />
                    <BooleanSelect
                      id="multi-include-contact"
                      label="Include contact details"
                      name="include_contact_details"
                    />
                    <BooleanSelect
                      id="multi-include-disclaimer"
                      label="Include disclaimer"
                      name="include_disclaimer"
                    />
                  </div>

                  <SubmitButton pendingLabel="Generating..." type="submit">
                    Generate Multi-Vehicle Brochure
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContent>
    </>
  );
}
