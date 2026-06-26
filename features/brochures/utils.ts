import { getSupabasePublicEnv } from "@/lib/supabase/env";
import {
  BROCHURE_EXPORT_STATUS_LABELS,
  BROCHURE_EXPORT_TYPE_LABELS,
} from "@/features/brochures/constants";
import type {
  BrochureExport,
  BrochureExportStatus,
  BrochureExportType,
  BrochurePickerFilters,
  BrochurePickerVehicle,
  BrochureVehicleItem,
} from "@/features/brochures/types";
import { buildPublicVehiclePath } from "@/features/facebook/utils";
import { slugifyVehicleValue } from "@/features/vehicles/utils";

export function getBrochureExportTypeLabel(type: BrochureExportType): string {
  return BROCHURE_EXPORT_TYPE_LABELS[type];
}

export function getBrochureExportStatusLabel(
  status: BrochureExportStatus,
): string {
  return BROCHURE_EXPORT_STATUS_LABELS[status];
}

export function buildBrochureDefaultTitle(input: {
  dealershipName: string;
  exportType: BrochureExportType;
  firstVehicleTitle?: string | null;
  vehicleCount: number;
}): string {
  if (input.exportType === "single_vehicle") {
    return input.firstVehicleTitle?.trim() || `${input.dealershipName} Vehicle Brochure`;
  }

  return input.vehicleCount === 2
    ? `${input.dealershipName} Vehicle Selection`
    : `${input.dealershipName} Multi-Vehicle Brochure`;
}

export function buildBrochureStoragePath(input: {
  brochureId: string;
  dealershipId: string;
  title: string;
}): string {
  const fileBase = slugifyVehicleValue(input.title) || "brochure";

  return `${input.dealershipId}/${input.brochureId}/${fileBase}.pdf`;
}

export function buildBrochureStorageObjectUrl(storagePath: string): string {
  const { NEXT_PUBLIC_SUPABASE_URL } = getSupabasePublicEnv();

  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/brochures/${storagePath}`;
}

export function buildBrochureDownloadFileName(exportRow: Pick<
  BrochureExport,
  "export_type" | "title"
>): string {
  const base =
    exportRow.title?.trim() ||
    getBrochureExportTypeLabel(exportRow.export_type);

  return `${slugifyVehicleValue(base) || "brochure"}.pdf`;
}

export function buildBrochurePublicVehicleUrl(input: {
  dealerSlug: string;
  siteUrl: string | null;
  vehicleAvailability: string;
  vehicleSlug: string;
  vehicleStatus: string;
}): string | null {
  if (
    !input.siteUrl ||
    input.vehicleStatus !== "published" ||
    input.vehicleAvailability !== "available"
  ) {
    return null;
  }

  const normalizedSiteUrl = input.siteUrl.replace(/\/+$/, "");

  return `${normalizedSiteUrl}${buildPublicVehiclePath(
    input.dealerSlug,
    input.vehicleSlug,
  )}`;
}

export function getBrochureDisclaimer(): string {
  return "Vehicle details, availability, and pricing may change without prior notice. Contact the dealership to confirm the latest unit condition and terms.";
}

export function sanitizeBrochureDescription(
  description: string | null,
  maxLength = 360,
): string | null {
  if (!description?.trim()) {
    return null;
  }

  const segments = description
    .split(/[\n\r\t]+/)
    .map((segment) => cleanMarketingSegment(segment))
    .map((segment) => stripUnsupportedBrochureCharacters(segment))
    .filter(
      (line) =>
        line.length > 0 &&
        !/^https?:\/\//i.test(line) &&
        !shouldSkipBrochureLine(line),
    );

  let value = segments
    .map((line) => line.replace(/[:;]+$/u, "").trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\(\s*key features:?/giu, ". Key features:")
    .replace(/\s*=[^\w\s)]{1,4}\s*/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/\.\s*\./g, ".")
    .trim();

  if (!value) {
    return null;
  }

  if (!/[.!?]$/.test(value)) {
    value = `${value}.`;
  }

  return value.length > maxLength
    ? `${value.slice(0, maxLength - 3).trimEnd()}...`
    : value;
}

function stripUnsupportedBrochureCharacters(value: string): string {
  return value
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\p{Emoji_Component}/gu, "")
    .replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200B\u2028\u2029\uFEFF]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldSkipBrochureLine(line: string): boolean {
  return (
    /^(for sale\b|cash price\b|negotiable\b|message now\b|pm for\b|inquiries\b|reservation\b)/iu.test(
      line,
    ) || /₱|php\s*[\d,]+/iu.test(line)
  );
}

function cleanMarketingSegment(segment: string): string {
  let value = stripUnsupportedBrochureCharacters(segment);

  value = value.replace(/^=+[^\w(]*/u, "");
  value = value.replace(/^[=+\-•*#|✓✔✅☑️]+\s*/u, "");
  value = value.replace(/(?:\s*=[^\w\s)]*)+$/gu, "");
  value = value.replace(/\s*[=+%¥₱•]+\s*$/u, "");

  return value.trim();
}

export const BROCHURE_PICKER_PAGE_SIZE = 25;

export function mapBrochureVehicleToPickerVehicle(
  vehicle: BrochureVehicleItem,
): BrochurePickerVehicle {
  return {
    availability: vehicle.availability,
    brand: vehicle.brand,
    featuredImageUrl: vehicle.featuredMedia?.signedUrl ?? null,
    hasPublicListingWarning:
      vehicle.status !== "published" || vehicle.availability !== "available",
    id: vehicle.id,
    model: vehicle.model,
    price: vehicle.price,
    status: vehicle.status,
    stockNumber: vehicle.stock_number,
    title: vehicle.title,
    year: vehicle.year,
  };
}

export function getBrochurePickerBrandOptions(
  vehicles: BrochurePickerVehicle[],
): string[] {
  return Array.from(
    new Set(
      vehicles
        .map((vehicle) => vehicle.brand.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function filterBrochurePickerVehicles(
  vehicles: BrochurePickerVehicle[],
  filters: BrochurePickerFilters,
): BrochurePickerVehicle[] {
  const search = filters.search.trim().toLowerCase();

  return vehicles.filter((vehicle) => {
    if (filters.status !== "all" && vehicle.status !== filters.status) {
      return false;
    }

    if (
      filters.availability !== "all" &&
      vehicle.availability !== filters.availability
    ) {
      return false;
    }

    if (filters.brand !== "all" && vehicle.brand !== filters.brand) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [
      vehicle.title,
      vehicle.brand,
      vehicle.model,
      vehicle.stockNumber,
      vehicle.year?.toString(),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}
