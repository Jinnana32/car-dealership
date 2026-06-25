import { z } from "zod";

import {
  VEHICLE_AVAILABILITIES,
  VEHICLE_LIST_DEFAULT_PAGE_SIZE,
  VEHICLE_LIST_PAGE_SIZES,
  VEHICLE_LIST_SORTS,
  VEHICLE_STATUSES,
} from "@/features/vehicles/constants";
import {
  VEHICLE_FINANCING_DISPLAY_STYLES,
  parseCheckboxValue,
  parseFinancingTermsInput,
  parseTextList,
  vehicleFinancingTermsSchema,
} from "@/features/vehicles/pricing";

const currentYear = new Date().getFullYear();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function nullableText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer.`)
    .transform((value) => value || null);
}

const optionalNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? value : numericValue;
}, z.number().nonnegative("Enter a valid number.").nullable());

const optionalInteger = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? value : numericValue;
}, z.number().int("Enter a whole number.").nonnegative("Enter a valid number.").nullable());

const optionalYear = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? value : numericValue;
}, z.number().int("Enter a valid year.").min(1900, "Enter a valid year.").max(currentYear + 1, "Enter a valid year.").nullable());

const optionalSlug = z
  .string()
  .trim()
  .max(160, "Slug must be 160 characters or fewer.")
  .refine(
    (value) => value === "" || slugPattern.test(value),
    "Use lowercase letters, numbers, and hyphens only.",
  )
  .transform((value) => value || null);

const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Select at least one image.")
  .refine((file) => file.type.startsWith("image/"), "Only image uploads are supported.")
  .refine(
    (file) => file.size <= 8 * 1024 * 1024,
    "Each image must be 8MB or smaller.",
  );

const optionalFilterNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? value : numericValue;
}, z.number().nonnegative("Enter a valid number.").nullable());

const optionalPage = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return 1;
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? value : numericValue;
}, z.number().int().min(1).catch(1));

export const vehicleListFiltersSchema = z.object({
  availability: z
    .enum(["all", ...VEHICLE_AVAILABILITIES] as const)
    .catch("all"),
  bodyType: z
    .string()
    .trim()
    .max(80)
    .catch("all")
    .transform((value) => value || "all"),
  brand: z
    .string()
    .trim()
    .max(120)
    .catch("all")
    .transform((value) => value || "all"),
  maxPrice: optionalFilterNumber.catch(null),
  minPrice: optionalFilterNumber.catch(null),
  page: optionalPage,
  pageSize: z.preprocess((value) => {
    if (value === null || value === undefined || value === "") {
      return VEHICLE_LIST_DEFAULT_PAGE_SIZE;
    }

    const numericValue = Number(value);

    return Number.isNaN(numericValue) ? value : numericValue;
  }, z
    .number()
    .int()
    .refine(
      (value): value is (typeof VEHICLE_LIST_PAGE_SIZES)[number] =>
        (VEHICLE_LIST_PAGE_SIZES as readonly number[]).includes(value),
      "Invalid page size.",
    )
    .catch(VEHICLE_LIST_DEFAULT_PAGE_SIZE)),
  search: z
    .string()
    .trim()
    .max(100, "Search must be 100 characters or fewer.")
    .catch("")
    .transform((value) => value || ""),
  sort: z.enum(VEHICLE_LIST_SORTS).catch("updated_desc"),
  status: z
    .enum(["active", "all", ...VEHICLE_STATUSES] as const)
    .catch("active"),
});

const optionalBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  return parseCheckboxValue(value as FormDataEntryValue | null);
}, z.boolean());

const textListField = z
  .string()
  .transform((value) => parseTextList(value));

const financingTermsField = z
  .string()
  .transform((value) => parseFinancingTermsInput(value))
  .pipe(vehicleFinancingTermsSchema);

export const createVehicleSchema = z.object({
  availability: z.enum(VEHICLE_AVAILABILITIES),
  body_type: nullableText(80),
  brand: z
    .string()
    .trim()
    .min(1, "Brand is required.")
    .max(120, "Brand must be 120 characters or fewer."),
  color: nullableText(80),
  condition_summary: nullableText(160),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5000 characters or fewer.")
    .transform((value) => value || null),
  engine: nullableText(120),
  financing_display_style: z.enum(VEHICLE_FINANCING_DISPLAY_STYLES).catch("detailed"),
  financing_down_payment_percent: optionalNumber.refine(
    (value) => value === null || (value >= 0 && value <= 100),
    "Enter a percentage between 0 and 100.",
  ),
  financing_down_payment_label: nullableText(80),
  financing_enabled: optionalBoolean,
  financing_headline: nullableText(160),
  financing_monthly_terms: financingTermsField.catch([]),
  financing_notes: nullableText(240),
  fuel_type: nullableText(80),
  highlights: textListField.catch([]),
  is_price_negotiable: optionalBoolean,
  mileage: optionalInteger,
  model: z
    .string()
    .trim()
    .min(1, "Model is required.")
    .max(120, "Model must be 120 characters or fewer."),
  plate_number: nullableText(80),
  post_location_tag: nullableText(80),
  price: optionalNumber,
  sale_inclusions: textListField.catch([]),
  show_cash_price_in_posts: optionalBoolean,
  slug: optionalSlug,
  status: z.enum(VEHICLE_STATUSES),
  stock_number: nullableText(80),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(160, "Title must be 160 characters or fewer."),
  transmission: nullableText(80),
  use_cases: textListField.catch([]),
  variant: nullableText(120),
  vin: nullableText(120),
  year: optionalYear,
});

export const updateVehicleSchema = createVehicleSchema;

export const uploadVehicleMediaSchema = z.object({
  alt_text: z
    .string()
    .trim()
    .max(160, "Alt text must be 160 characters or fewer.")
    .optional(),
  files: z
    .array(imageFileSchema)
    .min(1, "Select at least one image.")
    .max(12, "Upload up to 12 images at a time."),
  redirect_to: z
    .string()
    .trim()
    .optional(),
  vehicle_id: z.string().uuid("Invalid vehicle."),
});

export const vehicleStatusSchema = z.object({
  redirect_to: z.string().trim().optional(),
  status: z.enum(VEHICLE_STATUSES),
  vehicle_id: z.string().uuid("Invalid vehicle."),
});

export const vehicleAvailabilitySchema = z.object({
  availability: z.enum(VEHICLE_AVAILABILITIES),
  redirect_to: z.string().trim().optional(),
  vehicle_id: z.string().uuid("Invalid vehicle."),
});

export const archiveVehicleSchema = z.object({
  redirect_to: z.string().trim().optional(),
  vehicle_id: z.string().uuid("Invalid vehicle."),
});

export const setFeaturedVehicleMediaSchema = z.object({
  media_id: z.string().uuid("Invalid photo."),
  redirect_to: z.string().trim().optional(),
  vehicle_id: z.string().uuid("Invalid vehicle."),
});
