export const VEHICLE_SALE_PAYMENT_TYPES = [
  "cash",
  "financing",
  "trade_in",
  "other",
] as const;

export const VEHICLE_SALE_PAYMENT_TYPE_LABELS: Record<
  (typeof VEHICLE_SALE_PAYMENT_TYPES)[number],
  string
> = {
  cash: "Cash",
  financing: "Financing",
  other: "Other",
  trade_in: "Trade-in",
};

export const VEHICLE_SALE_PAYMENT_TYPE_FILTER_OPTIONS = [
  { label: "All payment types", value: "all" },
  { label: "Cash", value: "cash" },
  { label: "Financing", value: "financing" },
  { label: "Trade-in", value: "trade_in" },
  { label: "Other", value: "other" },
] as const;

export const SALE_PAYMENT_PLAN_TYPES = [
  "cash",
  "financing",
  "trade_in",
  "mixed",
] as const;

export const SALE_PAYMENT_PLAN_STATUSES = [
  "pending",
  "partially_paid",
  "paid_in_full",
  "overdue",
  "cancelled",
] as const;

export const SALE_PAYMENT_PLAN_TYPE_LABELS: Record<
  (typeof SALE_PAYMENT_PLAN_TYPES)[number],
  string
> = {
  cash: "Cash",
  financing: "Financing",
  mixed: "Mixed",
  trade_in: "Trade-in",
};

export const SALE_PAYMENT_PLAN_STATUS_LABELS: Record<
  (typeof SALE_PAYMENT_PLAN_STATUSES)[number],
  string
> = {
  cancelled: "Cancelled",
  overdue: "Overdue",
  paid_in_full: "Paid in full",
  partially_paid: "Partially paid",
  pending: "Pending",
};

export const SALE_PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "check",
  "gcash",
  "other",
] as const;

export const SALE_PAYMENT_METHOD_LABELS: Record<
  (typeof SALE_PAYMENT_METHODS)[number],
  string
> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  check: "Check",
  gcash: "GCash",
  other: "Other",
};

export const SALE_PAYMENT_METHOD_OPTIONS = SALE_PAYMENT_METHODS.map((value) => ({
  label: SALE_PAYMENT_METHOD_LABELS[value],
  value,
}));
