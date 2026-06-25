import { getSupabasePublicEnv } from "@/lib/supabase/env";
import {
  VEHICLE_AVAILABILITY_FILTER_OPTIONS,
  VEHICLE_AVAILABILITY_LABELS,
  VEHICLE_LIST_DEFAULT_PAGE_SIZE,
  VEHICLE_LIST_SORT_OPTIONS,
  VEHICLE_STATUS_FILTER_OPTIONS,
  VEHICLE_STATUS_LABELS,
} from "@/features/vehicles/constants";
import { normalizeVehicleFinancingTerms } from "@/features/vehicles/pricing";
import type {
  Vehicle,
  VehicleAvailability,
  VehicleListFilters,
  VehicleStatus,
} from "@/features/vehicles/types";

export function slugifyVehicleValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildVehicleSlugCandidate(input: {
  model: string;
  title: string;
  year: number | null;
}): string {
  const candidate = [input.title, input.model, input.year]
    .filter(Boolean)
    .join("-");

  return slugifyVehicleValue(candidate) || `vehicle-${Date.now()}`;
}

export function formatVehicleCurrency(value: number | null): string {
  if (value === null) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatVehicleDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatVehicleDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatVehicleMileage(value: number | null): string {
  if (value === null) {
    return "Not set";
  }

  return `${new Intl.NumberFormat("en-US").format(value)} km`;
}

export function formatVehicleMileageCompact(value: number | null): string {
  if (value === null) {
    return "Not set";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M KM`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;

    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K KM`;
  }

  return `${new Intl.NumberFormat("en-US").format(value)} KM`;
}

export function formatVehicleCurrencyCompact(value: number | null): string {
  if (value === null) {
    return "Not set";
  }

  if (value >= 1_000_000) {
    const millions = value / 1_000_000;

    return `₱${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;

    return `₱${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}K`;
  }

  return formatVehicleCurrency(value);
}

export function getVehicleAvailabilityLabel(
  availability: VehicleAvailability,
): string {
  return VEHICLE_AVAILABILITY_LABELS[availability];
}

export function getVehicleStatusLabel(status: VehicleStatus): string {
  return VEHICLE_STATUS_LABELS[status];
}

export function getVehicleSummaryLine(vehicle: Vehicle): string {
  return [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" • ");
}

export function getVehicleListGlanceLine(
  vehicle: Pick<
    Vehicle,
    | "body_type"
    | "brand"
    | "color"
    | "fuel_type"
    | "mileage"
    | "model"
    | "transmission"
    | "year"
  >,
  options?: {
    includeMileage?: boolean;
  },
): string {
  const specParts = [
    options?.includeMileage && vehicle.mileage !== null
      ? formatVehicleMileage(vehicle.mileage)
      : null,
    vehicle.transmission?.trim(),
    vehicle.fuel_type?.trim(),
    vehicle.body_type?.trim(),
    vehicle.color?.trim(),
  ].filter((value): value is string => Boolean(value));

  if (specParts.length > 0) {
    return specParts.join(" • ");
  }

  return getVehicleSummaryLine(vehicle as Vehicle);
}

export function buildVehicleStoragePath(input: {
  dealershipId: string;
  fileName: string;
  vehicleId: string;
}): string {
  const extension = input.fileName.includes(".")
    ? input.fileName.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";
  const fileBase = slugifyVehicleValue(
    input.fileName.replace(/\.[^/.]+$/, ""),
  );

  return `${input.dealershipId}/${input.vehicleId}/${crypto.randomUUID()}-${fileBase || "vehicle-photo"}.${extension}`;
}

export function buildVehicleStorageObjectUrl(storagePath: string): string {
  const { NEXT_PUBLIC_SUPABASE_URL } = getSupabasePublicEnv();

  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/vehicle-media/${storagePath}`;
}

export function buildVehiclePhotoAltText(
  vehicleTitle: string,
  photoNumber: number,
): string {
  return `${vehicleTitle} photo ${photoNumber}`;
}

export function buildVehicleTitle(vehicle: Vehicle): string {
  return vehicle.title || [vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(" ");
}

export type VehicleListPriceDisplay = {
  hint?: string;
  primary: string;
};

export function getVehicleListPriceDisplay(
  vehicle: Pick<
    Vehicle,
    | "financing_down_payment"
    | "financing_down_payment_percent"
    | "financing_enabled"
    | "financing_monthly_terms"
    | "price"
    | "show_cash_price_in_posts"
  >,
): VehicleListPriceDisplay {
  const terms = normalizeVehicleFinancingTerms(vehicle.financing_monthly_terms);
  const lowestMonthlyTerm = [...terms].sort(
    (left, right) => left.monthly_payment - right.monthly_payment,
  )[0];
  const financingHint =
    vehicle.financing_enabled && lowestMonthlyTerm
      ? `From ${formatVehicleCurrencyCompact(lowestMonthlyTerm.monthly_payment)}/mo`
      : undefined;

  if (vehicle.show_cash_price_in_posts && vehicle.price !== null) {
    return {
      hint: financingHint,
      primary: formatVehicleCurrency(vehicle.price),
    };
  }

  if (vehicle.financing_enabled && lowestMonthlyTerm) {
    return {
      hint:
        vehicle.financing_down_payment_percent !== null
          ? `DP ${vehicle.financing_down_payment_percent}%`
          : vehicle.financing_down_payment !== null
            ? `DP ${formatVehicleCurrencyCompact(vehicle.financing_down_payment)}`
            : undefined,
      primary: `From ${formatVehicleCurrency(lowestMonthlyTerm.monthly_payment)}/mo`,
    };
  }

  return {
    primary: formatVehicleCurrency(vehicle.price),
  };
}

export function vehicleListHasActiveFilters(filters: VehicleListFilters): boolean {
  return Boolean(
    filters.search ||
      filters.status !== "active" ||
      filters.availability !== "all" ||
      filters.brand !== "all" ||
      filters.bodyType !== "all" ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.sort !== "updated_desc",
  );
}

function getFilterOptionLabel(
  options: ReadonlyArray<{ label: string; value: string }>,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function getVehicleListFilterSummary(filters: VehicleListFilters): string[] {
  const summary: string[] = [];

  if (filters.search) {
    summary.push(`Search: ${filters.search}`);
  }

  if (filters.status !== "active") {
    summary.push(`Status: ${getFilterOptionLabel(VEHICLE_STATUS_FILTER_OPTIONS, filters.status)}`);
  }

  if (filters.availability !== "all") {
    summary.push(
      `Availability: ${getFilterOptionLabel(VEHICLE_AVAILABILITY_FILTER_OPTIONS, filters.availability)}`,
    );
  }

  if (filters.brand !== "all") {
    summary.push(`Brand: ${filters.brand}`);
  }

  if (filters.bodyType !== "all") {
    summary.push(`Body: ${filters.bodyType}`);
  }

  if (filters.minPrice !== null) {
    summary.push(`Min: ${formatVehicleCurrency(filters.minPrice)}`);
  }

  if (filters.maxPrice !== null) {
    summary.push(`Max: ${formatVehicleCurrency(filters.maxPrice)}`);
  }

  if (filters.sort !== "updated_desc") {
    summary.push(
      `Sort: ${getFilterOptionLabel(VEHICLE_LIST_SORT_OPTIONS, filters.sort)}`,
    );
  }

  if (filters.pageSize !== VEHICLE_LIST_DEFAULT_PAGE_SIZE) {
    summary.push(`${filters.pageSize} per page`);
  }

  return summary;
}

export function buildVehicleListHref(
  filters: VehicleListFilters,
  overrides?: Partial<VehicleListFilters>,
): string {
  const nextFilters = {
    ...filters,
    ...overrides,
  };
  const params = new URLSearchParams();

  if (nextFilters.search) {
    params.set("search", nextFilters.search);
  }

  if (nextFilters.status !== "active") {
    params.set("status", nextFilters.status);
  }

  if (nextFilters.availability !== "all") {
    params.set("availability", nextFilters.availability);
  }

  if (nextFilters.brand !== "all") {
    params.set("brand", nextFilters.brand);
  }

  if (nextFilters.bodyType !== "all") {
    params.set("bodyType", nextFilters.bodyType);
  }

  if (nextFilters.minPrice !== null) {
    params.set("minPrice", String(nextFilters.minPrice));
  }

  if (nextFilters.maxPrice !== null) {
    params.set("maxPrice", String(nextFilters.maxPrice));
  }

  if (nextFilters.sort !== "updated_desc") {
    params.set("sort", nextFilters.sort);
  }

  if (nextFilters.page > 1) {
    params.set("page", String(nextFilters.page));
  }

  if (nextFilters.pageSize !== VEHICLE_LIST_DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(nextFilters.pageSize));
  }

  const query = params.toString();

  return query ? `/admin/vehicles?${query}` : "/admin/vehicles";
}

export type VehicleDetailTab =
  | "overview"
  | "photos"
  | "marketing"
  | "sales"
  | "activity";

export function buildVehicleDetailPath(
  vehicleId: string,
  tab: VehicleDetailTab = "overview",
): string {
  if (tab === "overview") {
    return `/admin/vehicles/${vehicleId}`;
  }

  return `/admin/vehicles/${vehicleId}/${tab}`;
}
