import { z } from "zod";

import { VEHICLE_SALE_PAYMENT_TYPES } from "@/features/sales/constants";

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || "")
  .refine(
    (value) => value === "" || z.string().uuid().safeParse(value).success,
    "Select a valid record.",
  )
  .transform((value) => value || null);

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer.`)
    .optional()
    .transform((value) => value || null);

const optionalNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? value : parsed;
}, z.number().positive("Enter a valid amount.").nullable());

export const recordVehicleSaleSchema = z.object({
  asking_price: optionalNumber,
  confirm: z.literal("record_sale"),
  customer_id: optionalUuid,
  inquiry_id: optionalUuid,
  notes: optionalText(5000),
  payment_type: z
    .enum(VEHICLE_SALE_PAYMENT_TYPES)
    .nullable()
    .or(z.literal(""))
    .transform((value) => value || null),
  redirect_to: z.string().trim().optional(),
  sold_at: z
    .string()
    .trim()
    .min(1, "Sold date is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid sold date."),
  sold_price: z.preprocess((value) => {
    const parsed = Number(value);

    return Number.isNaN(parsed) ? value : parsed;
  }, z.number().positive("Sold price is required.")),
  vehicle_id: z.string().uuid("Invalid vehicle."),
});
