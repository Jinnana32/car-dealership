import { z } from "zod";

import { INQUIRY_SOURCE_TYPES, INQUIRY_STATUSES } from "@/features/inquiries/constants";
import { VEHICLE_SALE_PAYMENT_TYPES } from "@/features/sales/constants";
import { VEHICLE_AVAILABILITIES, VEHICLE_STATUSES } from "@/features/vehicles/constants";
import { preprocessMoneyValue } from "@/lib/money";

function optionalDateFilter() {
  return z
    .string()
    .trim()
    .max(20, "Enter a valid date.")
    .catch("")
    .transform((value) => value || "")
    .refine(
      (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
      "Enter a valid date.",
    );
}

function optionalUuidFilter() {
  return z
    .string()
    .trim()
    .catch("")
    .transform((value) => value || "")
    .refine(
      (value) => value === "" || z.string().uuid().safeParse(value).success,
      "Select a valid record.",
    );
}

function optionalTextFilter(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer.`)
    .catch("")
    .transform((value) => value || "");
}

function optionalNumberFilter() {
  return z.preprocess((value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    return preprocessMoneyValue(value);
  }, z.number().nonnegative("Enter a valid number.").nullable()).catch(null);
}

const reportDateRangeFields = {
  from: optionalDateFilter(),
  to: optionalDateFilter(),
};

function withDateRangeValidation<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((value, ctx) => {
    if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "From date must be before the To date.",
        path: ["from"],
      });
    }
  });
}

export const recordReportDateRangeSchema =
  withDateRangeValidation(reportDateRangeFields);

export const salesReportFilterSchema = withDateRangeValidation({
  ...reportDateRangeFields,
  paymentType: z.enum(["all", ...VEHICLE_SALE_PAYMENT_TYPES] as const).catch("all"),
  soldById: optionalUuidFilter(),
  vehicleId: optionalUuidFilter(),
});

export const inventoryReportFilterSchema = z.object({
  availability: z.enum(["all", ...VEHICLE_AVAILABILITIES] as const).catch("all"),
  brand: optionalTextFilter(120),
  maxPrice: optionalNumberFilter(),
  minPrice: optionalNumberFilter(),
  model: optionalTextFilter(120),
  status: z.enum(["all", ...VEHICLE_STATUSES] as const).catch("all"),
});

export const inquiryReportFilterSchema = withDateRangeValidation({
  ...reportDateRangeFields,
  assignedToId: optionalUuidFilter(),
  source: z.enum(["all", ...INQUIRY_SOURCE_TYPES] as const).catch("all"),
  status: z.enum(["all", ...INQUIRY_STATUSES] as const).catch("all"),
  vehicleId: optionalUuidFilter(),
});

export const leadSourceReportFilterSchema = recordReportDateRangeSchema;

export const pipelineReportFilterSchema = withDateRangeValidation({
  ...reportDateRangeFields,
  assignedToId: optionalUuidFilter(),
  source: z.enum(["all", ...INQUIRY_SOURCE_TYPES] as const).catch("all"),
  status: z.enum(["all", ...INQUIRY_STATUSES] as const).catch("all"),
});

export const csvExportFilterSchema = z
  .object({
    assignedToId: z.union([z.string(), z.array(z.string())]).optional(),
    availability: z.union([z.string(), z.array(z.string())]).optional(),
    brand: z.union([z.string(), z.array(z.string())]).optional(),
    from: z.union([z.string(), z.array(z.string())]).optional(),
    maxPrice: z.union([z.string(), z.array(z.string())]).optional(),
    minPrice: z.union([z.string(), z.array(z.string())]).optional(),
    model: z.union([z.string(), z.array(z.string())]).optional(),
    paymentType: z.union([z.string(), z.array(z.string())]).optional(),
    soldById: z.union([z.string(), z.array(z.string())]).optional(),
    source: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    to: z.union([z.string(), z.array(z.string())]).optional(),
    vehicleId: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .passthrough();
