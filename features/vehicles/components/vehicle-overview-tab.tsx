import Link from "next/link";
import type { ReactElement } from "react";

import { VehicleImage } from "@/features/vehicles/components/vehicle-image";
import { VehicleSpecList } from "@/features/vehicles/components/vehicle-spec-list";
import { VEHICLE_DETAIL_CONTENT_CLASS } from "@/features/vehicles/constants";
import {
  formatFinancingTermsSummary,
  formatVehicleDownPaymentDisplay,
  normalizeVehicleFinancingTerms,
} from "@/features/vehicles/pricing";
import type { Vehicle, VehicleMediaWithSignedUrl } from "@/features/vehicles/types";
import {
  buildVehicleDetailPath,
  formatVehicleCurrency,
  formatVehicleMileage,
} from "@/features/vehicles/utils";

type VehicleOverviewTabProps = {
  media: VehicleMediaWithSignedUrl[];
  vehicle: Vehicle;
};

function getOverviewSpecValue(value: string | null | undefined): string {
  const trimmed = value?.trim();

  return trimmed ? trimmed : "N/A";
}

export function VehicleOverviewTab({
  media,
  vehicle,
}: VehicleOverviewTabProps): ReactElement {
  const featuredMedia = media.find((item) => item.is_featured) ?? media[0] ?? null;
  const photosPath = buildVehicleDetailPath(vehicle.id, "photos");
  const financingTerms = normalizeVehicleFinancingTerms(vehicle.financing_monthly_terms);
  const glanceLine = [
    vehicle.condition_summary,
    formatVehicleMileage(vehicle.mileage),
    vehicle.fuel_type,
    vehicle.transmission,
    vehicle.body_type,
    vehicle.color,
    media.length > 0
      ? `${media.length} photo${media.length === 1 ? "" : "s"}`
      : "No photos yet",
    vehicle.stock_number ? `Stock ${vehicle.stock_number}` : null,
    vehicle.plate_number ? `Plate ${vehicle.plate_number}` : null,
  ].filter(Boolean);

  const financingItems = [
    {
      label: "Cash price",
      value: vehicle.price === null ? "N/A" : formatVehicleCurrency(vehicle.price),
    },
    {
      label: "Negotiable",
      value: vehicle.is_price_negotiable ? "Yes" : "No",
    },
    {
      label: "Show cash price in posts",
      value: vehicle.show_cash_price_in_posts ? "Yes" : "No",
    },
    {
      label: "Financing",
      value: vehicle.financing_enabled ? "Enabled" : "Not enabled",
    },
  ];

  if (vehicle.financing_enabled) {
    financingItems.push(
      {
        label: "Down payment",
        value: formatVehicleDownPaymentDisplay({
          cashPrice: vehicle.price,
          downPaymentAmount: vehicle.financing_down_payment,
          downPaymentPercent: vehicle.financing_down_payment_percent,
          formatCurrency: formatVehicleCurrency,
        }),
      },
      {
        label: "Monthly terms",
        value: formatFinancingTermsSummary(financingTerms, formatVehicleCurrency),
      },
    );
  }

  return (
    <div className={VEHICLE_DETAIL_CONTENT_CLASS}>
      <div className="rounded-2xl border border-border bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link className="shrink-0" href={photosPath}>
            <VehicleImage
              alt={vehicle.title}
              className="h-14 w-[4.5rem] rounded-lg"
              imageClassName="object-cover"
              src={featuredMedia?.signedUrl ?? null}
            />
          </Link>
          {glanceLine.length > 0 ? (
            <p className="min-w-0 text-sm leading-5 text-muted-foreground">
              {glanceLine.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <VehicleSpecList
          compact
          items={[
            {
              label: "Mileage",
              value:
                vehicle.mileage === null
                  ? "N/A"
                  : formatVehicleMileage(vehicle.mileage),
            },
            { label: "Condition", value: getOverviewSpecValue(vehicle.condition_summary) },
            { label: "Engine", value: getOverviewSpecValue(vehicle.engine) },
            { label: "Fuel type", value: getOverviewSpecValue(vehicle.fuel_type) },
            { label: "Transmission", value: getOverviewSpecValue(vehicle.transmission) },
          ]}
          title="Mechanical"
        />

        <VehicleSpecList
          compact
          items={[
            { label: "Body type", value: getOverviewSpecValue(vehicle.body_type) },
            { label: "Color", value: getOverviewSpecValue(vehicle.color) },
            { label: "Plate number", value: getOverviewSpecValue(vehicle.plate_number) },
            { label: "VIN", value: getOverviewSpecValue(vehicle.vin) },
            { label: "Stock number", value: getOverviewSpecValue(vehicle.stock_number) },
          ]}
          title="Registration"
        />

        <div className="lg:col-span-2">
          <VehicleSpecList compact items={financingItems} title="Financing" />
        </div>
      </div>

      {vehicle.description ? (
        <div className="rounded-2xl border border-border bg-white px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {vehicle.description}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
          No description yet. Add one on the edit page.
        </div>
      )}
    </div>
  );
}
