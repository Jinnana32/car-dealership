import { z } from "zod";

export const profileSettingsSchema = z.object({
  avatar_url: z
    .string()
    .trim()
    .url("Avatar URL must be a valid URL.")
    .or(z.literal(""))
    .transform((value) => value || null),
  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(120, "Full name must be 120 characters or fewer."),
});

export const dealershipSettingsSchema = z.object({
  contact_email: z
    .string()
    .trim()
    .email("Contact email must be valid.")
    .or(z.literal(""))
    .transform((value) => value || null),
  contact_phone: z
    .string()
    .trim()
    .max(50, "Contact phone must be 50 characters or fewer.")
    .transform((value) => value || null),
  facebook_page_url: z
    .string()
    .trim()
    .url("Facebook page URL must be valid.")
    .or(z.literal(""))
    .transform((value) => value || null),
  logo_url: z
    .string()
    .trim()
    .url("Logo URL must be valid.")
    .or(z.literal(""))
    .transform((value) => value || null),
  name: z
    .string()
    .trim()
    .min(1, "Dealership name is required.")
    .max(120, "Dealership name must be 120 characters or fewer."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(80, "Slug must be 80 characters or fewer.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
});

