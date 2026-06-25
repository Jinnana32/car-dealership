import type { Database } from "@/lib/supabase/database.types";
import type { Vehicle, VehicleMediaWithSignedUrl } from "@/features/vehicles/types";

export type BrochureExport =
  Database["public"]["Tables"]["brochure_exports"]["Row"];
export type BrochureExportInsert =
  Database["public"]["Tables"]["brochure_exports"]["Insert"];
export type BrochureExportUpdate =
  Database["public"]["Tables"]["brochure_exports"]["Update"];
export type BrochureExportType = BrochureExport["export_type"];
export type BrochureExportStatus = BrochureExport["status"];

export type BrochureExportFilters = {
  exportType: BrochureExportType | "all";
  status: BrochureExportStatus | "all";
};

export type BrochureVehicleItem = Vehicle & {
  featuredMedia: VehicleMediaWithSignedUrl | null;
};

export type BrochureGeneratorData = {
  totalCount: number;
  vehicles: BrochureVehicleItem[];
};

export type BrochureExportRecord = BrochureExport & {
  generatedByName: string | null;
  vehicles: Array<Pick<Vehicle, "availability" | "id" | "slug" | "status" | "title">>;
};

export type BrochureExportListResult = {
  exports: BrochureExportRecord[];
  filters: BrochureExportFilters;
  totalCount: number;
};

export type VehicleBrochureSummary = {
  exports: BrochureExportRecord[];
  totalCount: number;
};

export type BrochureGenerateFormValues = {
  include_contact_details: boolean;
  include_disclaimer: boolean;
  include_price: boolean;
  include_qr_code: boolean;
  redirect_to: string;
  title: string | null;
  vehicle_ids: string[];
};

export type PreparedBrochureVehicle = {
  bodyType: string | null;
  brand: string;
  color: string | null;
  description: string | null;
  featuredImageDataUrl: string | null;
  fuelType: string | null;
  mileage: number | null;
  model: string;
  price: number | null;
  publicUrl: string | null;
  qrCodeDataUrl: string | null;
  slug: string;
  title: string;
  transmission: string | null;
  variant: string | null;
  year: number | null;
};

export type PreparedBrochureDealership = {
  contactEmail: string | null;
  contactPhone: string | null;
  facebookPageUrl: string | null;
  logoDataUrl: string | null;
  logoUrl: string | null;
  name: string;
  slug: string;
};

export type PreparedBrochureDocument = {
  dealership: PreparedBrochureDealership;
  exportType: BrochureExportType;
  generatedAt: string;
  includeContactDetails: boolean;
  includeDisclaimer: boolean;
  includePrice: boolean;
  includeQrCode: boolean;
  title: string;
  vehicles: PreparedBrochureVehicle[];
};

export type BrochureGenerationWarning =
  | "public_url_unavailable"
  | "qr_generation_failed";
