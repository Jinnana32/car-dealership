import { z } from "zod";

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

export const customerListFiltersSchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must be 100 characters or fewer.")
    .catch("")
    .transform((value) => value || ""),
});

export const createCustomerSchema = z.object({
  email: optionalEmail,
  facebook_profile_url: nullableText(255),
  full_name: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(160, "Customer name must be 160 characters or fewer."),
  notes: nullableText(5000),
  phone: nullableText(40),
  source_type: nullableText(60),
});

export const updateCustomerSchema = createCustomerSchema.extend({
  customer_id: z.string().uuid("Invalid customer."),
  redirect_to: z.string().trim().optional(),
});
