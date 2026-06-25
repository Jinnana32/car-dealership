export const BROCHURE_EXPORT_TYPES = [
  "single_vehicle",
  "multi_vehicle",
] as const;

export const BROCHURE_EXPORT_STATUSES = [
  "pending",
  "generated",
  "failed",
] as const;

export const BROCHURE_EXPORT_TYPE_LABELS: Record<
  (typeof BROCHURE_EXPORT_TYPES)[number],
  string
> = {
  multi_vehicle: "Multi-Vehicle Brochure",
  single_vehicle: "Single Vehicle Brochure",
};

export const BROCHURE_EXPORT_STATUS_LABELS: Record<
  (typeof BROCHURE_EXPORT_STATUSES)[number],
  string
> = {
  failed: "Failed",
  generated: "Generated",
  pending: "Pending",
};

export const BROCHURE_EXPORT_TYPE_FILTER_OPTIONS = [
  { label: "All brochure types", value: "all" },
  { label: "Single Vehicle", value: "single_vehicle" },
  { label: "Multi-Vehicle", value: "multi_vehicle" },
] as const;

export const BROCHURE_EXPORT_STATUS_FILTER_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Generated", value: "generated" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
] as const;

export const BROCHURE_STORAGE_BUCKET = "brochures";
export const MAX_MULTI_BROCHURE_VEHICLES = 10;
