import { z } from "zod";

import {
  FACEBOOK_CONNECTION_STATUSES,
  FACEBOOK_GENERATED_CONTENT_TYPES,
  FACEBOOK_LEAD_STATUSES,
  FACEBOOK_MESSENGER_CONVERSATION_STATUSES,
  FACEBOOK_PUBLICATION_STATUSES,
  FACEBOOK_PUBLISH_TYPES,
} from "@/features/facebook/constants";
import {
  INQUIRY_STATUSES,
  PAYMENT_PREFERENCES,
} from "@/features/inquiries/constants";

function nullableText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer.`)
    .transform((value) => value || null);
}

function optionalUrl(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .max(maxLength, `${label} must be ${maxLength} characters or fewer.`)
    .refine(
      (value) => value === "" || z.string().url().safeParse(value).success,
      `Enter a valid ${label.toLowerCase()}.`,
    )
    .transform((value) => value || null);
}

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => value || "")
  .refine(
    (value) => value === "" || z.string().uuid().safeParse(value).success,
    "Select a valid vehicle.",
  );

function parseJsonObject(
  value: string,
): Record<string, unknown> | null {
  if (!value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const facebookConnectionSchema = z.object({
  ad_account_id: nullableText(160),
  facebook_page_url: optionalUrl(255, "Facebook page URL"),
  messenger_page_identifier: nullableText(160),
  notes: nullableText(2000),
  page_id: nullableText(160),
  page_name: nullableText(160),
  page_username: nullableText(160),
  pixel_id: nullableText(160),
  redirect_to: z.string().trim().optional(),
  status: z.enum(FACEBOOK_CONNECTION_STATUSES).catch("not_connected"),
});

export const generateFacebookContentSchema = z.object({
  content_type: z.enum(FACEBOOK_GENERATED_CONTENT_TYPES),
  redirect_to: z.string().trim().optional(),
  vehicle_id: z.string().uuid("Invalid vehicle."),
});

export const messengerClickSchema = z.object({
  dealerSlug: z
    .string()
    .trim()
    .min(1, "Dealership slug is required.")
    .max(120, "Dealership slug is invalid."),
  vehicleSlug: z
    .string()
    .trim()
    .min(1, "Vehicle slug is required.")
    .max(160, "Vehicle slug is invalid."),
});

export const facebookWebhookVerificationSchema = z.object({
  challenge: z.string().trim().min(1, "Missing challenge."),
  mode: z.string().trim().min(1, "Missing webhook mode."),
  token: z.string().trim().min(1, "Missing verify token."),
});

export const facebookMessengerWebhookPayloadSchema = z
  .object({
    entry: z
      .array(
        z
          .object({
            id: z.string().trim().optional(),
            messaging: z.array(z.unknown()).optional(),
            time: z.union([z.number(), z.string().trim()]).optional(),
          })
          .passthrough(),
      )
      .default([]),
    object: z.string().trim().min(1, "Missing webhook object."),
  })
  .passthrough();

export const facebookLeadWebhookSchema = z
  .object({
    entry: z
      .array(
        z
          .object({
            changes: z.array(z.unknown()).optional(),
            id: z.string().trim().optional(),
            time: z.union([z.number(), z.string().trim()]).optional(),
          })
          .passthrough(),
      )
      .default([]),
    object: z.string().trim().min(1, "Missing webhook object."),
  })
  .passthrough();

export const facebookMessengerInboxFiltersSchema = z.object({
  q: z
    .string()
    .trim()
    .max(160, "Search must be 160 characters or fewer.")
    .catch(""),
  status: z
    .enum(["all", ...FACEBOOK_MESSENGER_CONVERSATION_STATUSES] as const)
    .catch("all"),
});

export const facebookContentHistoryFiltersSchema = z.object({
  contentType: z.enum(["all", ...FACEBOOK_GENERATED_CONTENT_TYPES] as const).catch("all"),
  vehicleId: optionalUuid.catch(""),
});

export const facebookLeadHistoryFiltersSchema = z.object({
  status: z.enum(["all", ...FACEBOOK_LEAD_STATUSES] as const).catch("all"),
});

export const facebookLeadFormMappingFiltersSchema = z.object({
  edit: optionalUuid.catch(""),
});

export const facebookPublishVehicleSchema = z.object({
  caption: z
    .string()
    .trim()
    .min(5, "Caption must be at least 5 characters.")
    .max(5000, "Caption must be 5000 characters or fewer."),
  confirm_publish: z
    .enum(["true"])
    .transform((value) => value === "true"),
  generated_content_id: optionalUuid.catch(""),
  publish_type: z.enum(FACEBOOK_PUBLISH_TYPES),
  redirect_to: z.string().trim().optional(),
  vehicle_id: z.string().uuid("Invalid vehicle."),
});

export const facebookPublicationHistorySchema = z.object({
  status: z.enum(["all", ...FACEBOOK_PUBLICATION_STATUSES] as const).catch("all"),
  vehicleId: optionalUuid.catch(""),
});

export const facebookLeadFormMappingSchema = z.object({
  field_map_json: z
    .string()
    .trim()
    .min(2, "Field mapping JSON is required.")
    .refine(
      (value) => parseJsonObject(value) !== null,
      "Field mapping must be a valid JSON object.",
    ),
  form_id: z
    .string()
    .trim()
    .min(1, "Form ID is required.")
    .max(160, "Form ID must be 160 characters or fewer."),
  form_name: z
    .string()
    .trim()
    .max(160, "Form name must be 160 characters or fewer.")
    .transform((value) => value || null),
  is_active: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
  mapping_id: optionalUuid.catch(""),
  redirect_to: z.string().trim().optional(),
  vehicle_id: optionalUuid.catch(""),
});

export const facebookLeadRetrySchema = z.object({
  lead_id: z.string().uuid("Invalid lead."),
  redirect_to: z.string().trim().optional(),
});

export const messengerConversationActionSchema = z.object({
  conversation_id: z.string().uuid("Invalid conversation."),
  redirect_to: z.string().trim().optional(),
});

export const messengerDuplicateSearchSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(160, "Customer name must be 160 characters or fewer."),
  email: z
    .string()
    .trim()
    .max(200, "Email must be 200 characters or fewer.")
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Enter a valid email address.",
    )
    .transform((value) => value || null),
  phone: nullableText(40),
});

export const convertMessengerConversationSchema = z.object({
  assigned_to: optionalUuid,
  budget_range: nullableText(120),
  conversation_id: z.string().uuid("Invalid conversation."),
  customer_name: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(160, "Customer name must be 160 characters or fewer."),
  duplicate_resolution: z
    .enum(["create_new", "use_existing"])
    .optional()
    .transform((value) => value ?? ""),
  email: z
    .string()
    .trim()
    .max(200, "Email must be 200 characters or fewer.")
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Enter a valid email address.",
    )
    .transform((value) => value || null),
  existing_customer_id: optionalUuid,
  interested_vehicle_id: optionalUuid,
  message: z
    .string()
    .trim()
    .max(5000, "Message must be 5000 characters or fewer.")
    .transform((value) => value || ""),
  next_follow_up_at: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine(
      (value) => value === null || !Number.isNaN(Date.parse(value)),
      "Enter a valid date and time.",
    ),
  payment_preference: z
    .enum(PAYMENT_PREFERENCES)
    .optional()
    .transform((value) => value ?? ""),
  phone: nullableText(40),
  redirect_to: z.string().trim().optional(),
  source_detail: nullableText(160),
  status: z.enum(INQUIRY_STATUSES),
});
