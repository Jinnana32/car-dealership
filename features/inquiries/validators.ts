import { z } from "zod";

import {
  INQUIRY_SOURCE_TYPES,
  INQUIRY_STATUSES,
  MANUAL_LEAD_SOURCE_TYPES,
  PAYMENT_PREFERENCES,
} from "@/features/inquiries/constants";
import { PIPELINE_FOLLOW_UP_FILTER_OPTIONS } from "@/features/pipeline/constants";

function nullableText(maxLength: number) {
  return z
    .preprocess(
      (value) => value ?? "",
      z.string().trim().max(maxLength, `Must be ${maxLength} characters or fewer.`),
    )
    .transform((value) => value || null);
}

const optionalEmail = z
  .preprocess(
    (value) => value ?? "",
    z
      .string()
      .trim()
      .max(200, "Email must be 200 characters or fewer.")
      .refine(
        (value) => value === "" || z.string().email().safeParse(value).success,
        "Enter a valid email address.",
      ),
  )
  .transform((value) => value || null);

const optionalUuid = z
  .preprocess((value) => value ?? "", z.string().trim())
  .transform((value) => value || null)
  .refine(
    (value) => value === null || z.string().uuid().safeParse(value).success,
    "Select a valid option.",
  );

const optionalDateTime = z
  .preprocess((value) => value ?? "", z.string().trim())
  .transform((value) => value || null)
  .refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    "Enter a valid date and time.",
  );

const optionalPaymentPreference = z
  .preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.enum(PAYMENT_PREFERENCES).optional(),
  )
  .transform((value) => value ?? null);

export const inquiryListFiltersSchema = z.object({
  assignedToId: z
    .string()
    .trim()
    .max(64, "Assigned filter is invalid.")
    .catch("")
    .transform((value) => value || ""),
  followUp: z
    .enum(
      PIPELINE_FOLLOW_UP_FILTER_OPTIONS.map((option) => option.value) as [
        "all",
        "overdue",
        "today",
        "future",
        "none",
      ],
    )
    .catch("all"),
  search: z
    .string()
    .trim()
    .max(100, "Search must be 100 characters or fewer.")
    .catch("")
    .transform((value) => value || ""),
  source: z.enum(["all", ...INQUIRY_SOURCE_TYPES] as const).catch("all"),
  status: z.enum(["all", ...INQUIRY_STATUSES] as const).catch("all"),
  vehicleId: z
    .string()
    .trim()
    .max(64, "Vehicle filter is invalid.")
    .catch("")
    .transform((value) => value || ""),
});

export const searchPossibleCustomerDuplicatesSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(160, "Customer name must be 160 characters or fewer."),
  email: optionalEmail,
  phone: nullableText(40),
});

export const createManualLeadSchema = z.object({
  assigned_to: optionalUuid,
  budget_range: nullableText(120),
  customer_name: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(160, "Customer name must be 160 characters or fewer."),
  duplicate_resolution: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(["create_new", "use_existing"]).optional(),
    )
    .transform((value) => value ?? ""),
  email: optionalEmail,
  existing_customer_id: optionalUuid,
  interested_vehicle_id: optionalUuid,
  message: z
    .string()
    .trim()
    .max(5000, "Message must be 5000 characters or fewer.")
    .transform((value) => value || ""),
  next_follow_up_at: optionalDateTime,
  payment_preference: optionalPaymentPreference.transform((value) => value ?? ""),
  phone: nullableText(40),
  source_detail: nullableText(160),
  source_type: z.enum(MANUAL_LEAD_SOURCE_TYPES),
  status: z.enum(INQUIRY_STATUSES),
});

export const createInquirySchema = z.object({
  assigned_to: optionalUuid,
  budget_range: nullableText(120),
  customer_id: z.string().uuid("Invalid customer."),
  next_follow_up_at: optionalDateTime,
  original_message: nullableText(5000),
  payment_preference: optionalPaymentPreference,
  source_detail: nullableText(160),
  source_reference_id: nullableText(160),
  source_type: z.enum(INQUIRY_SOURCE_TYPES),
  status: z.enum(INQUIRY_STATUSES),
  vehicle_id: optionalUuid,
});

export const updateInquirySchema = z.object({
  budget_range: nullableText(120),
  inquiry_id: z.string().uuid("Invalid inquiry."),
  original_message: nullableText(5000),
  payment_preference: optionalPaymentPreference,
  redirect_to: z.string().trim().optional(),
  source_detail: nullableText(160),
  vehicle_id: optionalUuid,
});

export const assignmentUpdateSchema = z.object({
  assigned_to: optionalUuid,
  inquiry_id: z.string().uuid("Invalid inquiry."),
  redirect_to: z.string().trim().optional(),
});

export const followUpUpdateSchema = z.object({
  inquiry_id: z.string().uuid("Invalid inquiry."),
  next_follow_up_at: optionalDateTime,
  redirect_to: z.string().trim().optional(),
});

export const inquiryNoteSchema = z.object({
  inquiry_id: z.string().uuid("Invalid inquiry."),
  note: z
    .string()
    .trim()
    .min(1, "Note is required.")
    .max(5000, "Note must be 5000 characters or fewer."),
  redirect_to: z.string().trim().optional(),
});
