import { z } from "zod";

import { SALE_PAYMENT_METHODS, VEHICLE_SALE_PAYMENT_TYPES } from "@/features/sales/constants";
import {
  preprocessMoneyValue,
  preprocessRequiredMoneyValue,
} from "@/lib/money";

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

  return preprocessMoneyValue(value);
}, z.number().positive("Enter a valid amount.").nullable());

const optionalNonNegativeNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return preprocessMoneyValue(value);
}, z.number().nonnegative("Enter a valid amount.").nullable());

const optionalPositiveInt = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().positive("Enter a valid term in months.").nullable());

const formBooleanField = z.preprocess(
  (value) => (value === null || value === undefined ? "" : value),
  z.union([z.literal("true"), z.literal("false"), z.literal("")]),
);

const planTbdField = formBooleanField.transform((value) => value === "true");

const optionalTermYears = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().min(1, "Enter a valid term in years.").max(10, "Term cannot exceed 10 years.").nullable());

const salePlanFields = {
  down_payment_amount: optionalNonNegativeNumber,
  down_payment_input_mode: z.enum(["amount", "percent"]).catch("amount"),
  down_payment_value: optionalNonNegativeNumber,
  financier_name: optionalText(200),
  monthly_payment: optionalNonNegativeNumber,
  plan_tbd: planTbdField,
  term_months: optionalPositiveInt,
  term_years: optionalTermYears,
  trade_in_amount: optionalNonNegativeNumber,
};

function validateSalePlanDetails(
  value: {
    down_payment_amount: number | null;
    down_payment_input_mode: "amount" | "percent";
    down_payment_value: number | null;
    payment_type: (typeof VEHICLE_SALE_PAYMENT_TYPES)[number] | null;
    plan_tbd: boolean;
    sold_price: number;
    term_months: number | null;
    term_years: number | null;
    trade_in_amount: number | null;
  },
  ctx: z.RefinementCtx,
): void {
  const downPaymentAmount =
    value.down_payment_value !== null
      ? value.down_payment_value
      : value.down_payment_amount;
  const collectedAtClosing = (downPaymentAmount ?? 0) + (value.trade_in_amount ?? 0);

  if (collectedAtClosing > value.sold_price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Down payment and trade-in cannot exceed the sold price.",
      path: ["down_payment_value"],
    });
  }

  if (
    (value.payment_type === "financing" || value.payment_type === "other") &&
    !value.plan_tbd
  ) {
    if (value.term_years === null && value.term_months === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the financing term in years or mark the plan as TBD.",
        path: ["term_years"],
      });
    }

    if (downPaymentAmount === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a down payment or mark the plan as TBD.",
        path: ["down_payment_value"],
      });
    }
  }
}

export const recordVehicleSaleSchema = z
  .object({
    asking_price: optionalNumber,
    confirm: z.literal("record_sale"),
    customer_id: optionalUuid,
    inquiry_id: optionalUuid,
    notes: optionalText(5000),
    payment_type: z.preprocess(
      (value) => (value === null || value === undefined || value === "" ? null : value),
      z.enum(VEHICLE_SALE_PAYMENT_TYPES).nullable(),
    ),
    redirect_to: z.string().trim().optional(),
    sold_at: z
      .string()
      .trim()
      .min(1, "Sold date is required.")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid sold date."),
    sold_price: z.preprocess(
      preprocessRequiredMoneyValue,
      z.number().positive("Sold price is required."),
    ),
    vehicle_id: z.string().uuid("Invalid vehicle."),
    ...salePlanFields,
  })
  .superRefine(validateSalePlanDetails);

export const recordQuickSaleSchema = z
  .object({
    asking_price: optionalNumber,
    confirm: z.literal("quick_sale"),
    customer_name: z.string().trim().min(1, "Customer name is required."),
    email: z
      .string()
      .trim()
      .email("Enter a valid email.")
      .optional()
      .or(z.literal(""))
      .transform((value) => value || null),
    existing_customer_id: optionalUuid,
    notes: optionalText(5000),
    payment_type: z.preprocess(
      (value) => (value === null || value === undefined || value === "" ? "cash" : value),
      z.enum(VEHICLE_SALE_PAYMENT_TYPES),
    ),
    phone: z.string().trim().min(1, "Phone is required."),
    redirect_to: z.string().trim().optional(),
    sold_at: z
      .string()
      .trim()
      .min(1, "Sold date is required.")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid sold date."),
    sold_price: z.preprocess(
      preprocessRequiredMoneyValue,
      z.number().positive("Sold price is required."),
    ),
    vehicle_id: z.string().uuid("Select a vehicle."),
    ...salePlanFields,
  })
  .superRefine(validateSalePlanDetails);

export const updateSalePaymentPlanSchema = z
  .object({
    down_payment_amount: optionalNonNegativeNumber,
    financier_name: optionalText(200),
    monthly_payment: optionalNonNegativeNumber,
    plan_id: z.string().uuid("Invalid payment plan."),
    plan_tbd: planTbdField,
    redirect_to: z.string().trim().optional(),
    sale_id: z.string().uuid("Invalid sale."),
    term_months: optionalPositiveInt,
    total_amount: z.preprocess(
      preprocessRequiredMoneyValue,
      z.number().positive("Total amount is required."),
    ),
    trade_in_amount: optionalNonNegativeNumber,
  })
  .superRefine((value, ctx) => {
    const collectedAtClosing =
      (value.down_payment_amount ?? 0) + (value.trade_in_amount ?? 0);

    if (collectedAtClosing > value.total_amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Down payment and trade-in cannot exceed the total amount.",
        path: ["down_payment_amount"],
      });
    }

    if (!value.plan_tbd) {
      if (value.term_months === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the financing term or mark the plan as TBD.",
          path: ["term_months"],
        });
      }
    }
  });

const allowOverpaymentField = formBooleanField.transform((value) => value === "true");

export const recordSalePaymentSchema = z
  .object({
    allow_overpayment: allowOverpaymentField,
    amount: z.preprocess(
      preprocessRequiredMoneyValue,
      z.number().positive("Enter a valid payment amount."),
    ),
    notes: optionalText(2000),
    override_note: optionalText(500),
    paid_at: z
      .string()
      .trim()
      .min(1, "Payment date is required.")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid payment date."),
    payment_method: z.enum(SALE_PAYMENT_METHODS),
    plan_id: optionalUuid,
    redirect_to: z.string().trim().optional(),
    reference_number: optionalText(120),
    sale_id: z.string().uuid("Invalid sale."),
  })
  .superRefine((value, ctx) => {
    if (value.allow_overpayment && !value.override_note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add an override note when recording an overpayment.",
        path: ["override_note"],
      });
    }
  });

export const voidSalePaymentSchema = z.object({
  payment_id: z.string().uuid("Invalid payment."),
  redirect_to: z.string().trim().optional(),
  sale_id: z.string().uuid("Invalid sale."),
  void_note: optionalText(500),
});

const optionalDateFilter = () =>
  z
    .string()
    .trim()
    .max(20, "Enter a valid date.")
    .catch("")
    .transform((value) => value || "")
    .refine(
      (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
      "Enter a valid date.",
    );

const optionalUuidFilter = () =>
  z
    .string()
    .trim()
    .catch("")
    .transform((value) => value || "")
    .refine(
      (value) => value === "" || z.string().uuid().safeParse(value).success,
      "Select a valid record.",
    );

const optionalSearchFilter = () =>
  z
    .string()
    .trim()
    .max(120, "Search must be 120 characters or fewer.")
    .catch("")
    .transform((value) => value || "");

export const salesListFilterSchema = z
  .object({
    from: optionalDateFilter(),
    paymentType: z.enum(["all", ...VEHICLE_SALE_PAYMENT_TYPES] as const).catch("all"),
    search: optionalSearchFilter(),
    soldById: optionalUuidFilter(),
    to: optionalDateFilter(),
    vehicleId: optionalUuidFilter(),
  })
  .superRefine((value, ctx) => {
    if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "From date must be before the To date.",
        path: ["from"],
      });
    }
  });
