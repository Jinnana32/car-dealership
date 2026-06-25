import { z } from "zod";

import { PAYMENT_PREFERENCES } from "@/features/inquiries/constants";

function nullableText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer.`)
    .transform((value) => value || null);
}

const optionalEmail = z
  .string()
  .trim()
  .max(200, "Email must be 200 characters or fewer.")
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Enter a valid email address.",
  )
  .transform((value) => value || null);

const optionalDateTime = z
  .string()
  .trim()
  .max(64, "Preferred viewing date is invalid.")
  .refine(
    (value) => value === "" || !Number.isNaN(Date.parse(value)),
    "Enter a valid preferred viewing date.",
  )
  .transform((value) => value || null);

export const publicInquirySchema = z.object({
  budget_range: nullableText(120),
  company_website: z
    .string()
    .trim()
    .max(255, "Spam field is invalid.")
    .optional()
    .transform((value) => value ?? ""),
  dealerSlug: z
    .string()
    .trim()
    .min(1, "Dealership slug is required.")
    .max(120, "Dealership slug is invalid."),
  email: optionalEmail,
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(160, "Full name must be 160 characters or fewer."),
  message: z
    .string()
    .trim()
    .max(5000, "Message must be 5000 characters or fewer.")
    .transform((value) => value || null),
  payment_preference: z
    .enum(PAYMENT_PREFERENCES)
    .optional()
    .transform((value) => value ?? null),
  phone: z
    .string()
    .trim()
    .min(6, "Phone must be at least 6 characters.")
    .max(40, "Phone must be 40 characters or fewer."),
  preferred_viewing_date: optionalDateTime,
  vehicleSlug: z
    .string()
    .trim()
    .min(1, "Vehicle slug is required.")
    .max(160, "Vehicle slug is invalid."),
});
