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
