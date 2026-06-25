import { z } from "zod";

import {
  BROCHURE_EXPORT_STATUSES,
  BROCHURE_EXPORT_TYPES,
  MAX_MULTI_BROCHURE_VEHICLES,
} from "@/features/brochures/constants";

function parseBoolean(value: string | null | undefined, fallback: boolean): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

const optionalTitleSchema = z
  .string()
  .trim()
  .max(160, "Title must be 160 characters or fewer.")
  .transform((value) => value || null);

const vehicleIdsSchema = z
  .array(z.string().uuid("Select valid vehicles."))
  .max(
    MAX_MULTI_BROCHURE_VEHICLES,
    `Select no more than ${MAX_MULTI_BROCHURE_VEHICLES} vehicles.`,
  );

export const brochureGenerateSchema = z.object({
  export_type: z.enum(BROCHURE_EXPORT_TYPES),
  include_contact_details: z.boolean().default(true),
  include_disclaimer: z.boolean().default(true),
  include_price: z.boolean().default(true),
  include_qr_code: z.boolean().default(true),
  redirect_to: z.string().trim().optional(),
  title: optionalTitleSchema,
  vehicle_ids: vehicleIdsSchema,
});

export const singleVehicleBrochureSchema = brochureGenerateSchema.superRefine(
  (value, context) => {
    if (value.export_type !== "single_vehicle") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Single vehicle brochure type is required.",
        path: ["export_type"],
      });
    }

    if (value.vehicle_ids.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select exactly one vehicle.",
        path: ["vehicle_ids"],
      });
    }
  },
);

export const multiVehicleBrochureSchema = brochureGenerateSchema.superRefine(
  (value, context) => {
    if (value.export_type !== "multi_vehicle") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Multi-vehicle brochure type is required.",
        path: ["export_type"],
      });
    }

    if (value.vehicle_ids.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least two vehicles.",
        path: ["vehicle_ids"],
      });
    }
  },
);

export const brochureExportQuerySchema = z.object({
  exportType: z.enum(["all", ...BROCHURE_EXPORT_TYPES] as const).catch("all"),
  status: z.enum(["all", ...BROCHURE_EXPORT_STATUSES] as const).catch("all"),
});

export function parseBrochureFormBooleans(input: {
  include_contact_details?: string | null;
  include_disclaimer?: string | null;
  include_price?: string | null;
  include_qr_code?: string | null;
}) {
  return {
    include_contact_details: parseBoolean(
      input.include_contact_details,
      true,
    ),
    include_disclaimer: parseBoolean(input.include_disclaimer, true),
    include_price: parseBoolean(input.include_price, true),
    include_qr_code: parseBoolean(input.include_qr_code, true),
  };
}
