import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { BROCHURE_EXPORT_STATUS_LABELS, BROCHURE_EXPORT_TYPE_LABELS } from "@/features/brochures/constants";
import type {
  BrochureExport,
  BrochureExportStatus,
  BrochureExportType,
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
