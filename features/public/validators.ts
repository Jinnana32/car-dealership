import { z } from "zod";

const numericFilter = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? value : parsed;
}, z.number().nonnegative("Enter a valid price.").nullable());

export const publicVehicleFiltersSchema = z
  .object({
    brand: z
      .string()
      .trim()
      .max(120, "Brand filter must be 120 characters or fewer.")
      .catch("")
      .transform((value) => value || ""),
    maxPrice: numericFilter.catch(null),
    minPrice: numericFilter.catch(null),
    model: z
      .string()
      .trim()
      .max(120, "Model filter must be 120 characters or fewer.")
      .catch("")
      .transform((value) => value || ""),
    search: z
      .string()
      .trim()
      .max(100, "Search must be 100 characters or fewer.")
      .catch("")
      .transform((value) => value || ""),
  })
  .refine(
    (value) =>
      value.minPrice === null ||
      value.maxPrice === null ||
      value.minPrice <= value.maxPrice,
    {
      message: "Minimum price must be less than or equal to maximum price.",
      path: ["minPrice"],
    },
  );
