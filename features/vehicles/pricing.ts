import { z } from "zod";

export const VEHICLE_FINANCING_DISPLAY_STYLES = [
  "detailed",
  "compact",
  "headline_only",
] as const;

export type VehicleFinancingDisplayStyle =
  (typeof VEHICLE_FINANCING_DISPLAY_STYLES)[number];

export const VEHICLE_FINANCING_DISPLAY_STYLE_LABELS: Record<
  VehicleFinancingDisplayStyle,
  string
> = {
  compact: "Compact",
  detailed: "Detailed",
  headline_only: "Headline only",
};

export const VEHICLE_FINANCING_TERM_YEAR_OPTIONS = [3, 4, 5, 6, 7] as const;

export type DownPaymentInputMode = "amount" | "percent";

export type VehicleFinancingTermYearOption =
  (typeof VEHICLE_FINANCING_TERM_YEAR_OPTIONS)[number];

export type VehicleFinancingTerm = {
  label?: string | null;
  monthly_payment: number;
  term_years: number;
};

export type VehiclePostDefaults = {
  defaultFinancingHeadline: string | null;
  defaultPostLocationTag: string | null;
  defaultSaleInclusions: string[];
};

const vehicleFinancingTermSchema = z.object({
  label: z.string().trim().max(40).nullable().optional(),
  monthly_payment: z.number().positive("Enter a valid monthly payment."),
  term_years: z.number().int().min(1).max(10),
});

export const vehicleFinancingTermsSchema = z.array(vehicleFinancingTermSchema);

export function parseCheckboxValue(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "on";
}

export function parseTextList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function serializeTextList(values: string[] | null | undefined): string {
  return (values ?? []).join("\n");
}

export function parseFinancingTermsInput(value: string): VehicleFinancingTerm[] {
  const terms: VehicleFinancingTerm[] = [];

  for (const rawLine of value.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const [termPart, paymentPart] = line.split(/[=:|]/).map((part) => part.trim());

    if (!termPart || !paymentPart) {
      continue;
    }

    const termYears = Number.parseInt(termPart.replace(/\D/g, ""), 10);
    const normalizedPayment = paymentPart
      .replace(/[₱,\s]/g, "")
      .replace(/k$/i, "000")
      .replace(/m$/i, "000000");
    const monthlyPayment = Number(normalizedPayment);

    if (!Number.isFinite(termYears) || termYears < 1 || !Number.isFinite(monthlyPayment)) {
      continue;
    }

    terms.push({
      monthly_payment: monthlyPayment,
      term_years: termYears,
    });
  }

  return terms.sort((left, right) => left.term_years - right.term_years);
}

export function serializeFinancingTermsInput(
  terms: VehicleFinancingTerm[] | null | undefined,
): string {
  return (terms ?? [])
    .map((term) => `${term.term_years}=${term.monthly_payment}`)
    .join("\n");
}

export function normalizeVehicleFinancingTerms(
  value: unknown,
): VehicleFinancingTerm[] {
  const parsed = vehicleFinancingTermsSchema.safeParse(value);

  if (!parsed.success) {
    return [];
  }

  return parsed.data.sort((left, right) => left.term_years - right.term_years);
}

export function computeDownPaymentFromPercent(
  cashPrice: number | null,
  downPaymentPercent: number | null | undefined,
): number | null {
  if (cashPrice === null || cashPrice <= 0 || downPaymentPercent === null || downPaymentPercent === undefined) {
    return null;
  }

  return Math.round((cashPrice * downPaymentPercent) / 100);
}

export function inferDownPaymentPercent(input: {
  cashPrice: number | null;
  downPaymentAmount: number | null;
  downPaymentPercent?: number | null;
}): number | null {
  if (input.downPaymentPercent !== null && input.downPaymentPercent !== undefined) {
    return input.downPaymentPercent;
  }

  if (
    input.cashPrice === null ||
    input.cashPrice <= 0 ||
    input.downPaymentAmount === null ||
    input.downPaymentAmount < 0
  ) {
    return null;
  }

  return Math.round((input.downPaymentAmount / input.cashPrice) * 10000) / 100;
}

export function formatVehicleDownPaymentDisplay(input: {
  cashPrice: number | null;
  downPaymentAmount: number | null;
  downPaymentPercent: number | null;
  formatCurrency: (value: number) => string;
}): string {
  const amount =
    input.downPaymentAmount ??
    computeDownPaymentFromPercent(input.cashPrice, input.downPaymentPercent);

  if (input.downPaymentPercent !== null) {
    return amount !== null
      ? `${input.downPaymentPercent}% (${input.formatCurrency(amount)})`
      : `${input.downPaymentPercent}%`;
  }

  if (amount !== null) {
    return input.formatCurrency(amount);
  }

  return "N/A";
}

export function resolveDownPaymentAmount(input: {
  cashPrice: number | null;
  mode: DownPaymentInputMode;
  value: number | null;
}): {
  amount: number | null;
  percent: number | null;
} {
  if (
    input.cashPrice === null ||
    input.cashPrice <= 0 ||
    input.value === null ||
    input.value < 0
  ) {
    return { amount: null, percent: null };
  }

  if (input.mode === "percent") {
    if (input.value > 100) {
      return { amount: null, percent: null };
    }

    const amount = computeDownPaymentFromPercent(input.cashPrice, input.value);

    return {
      amount,
      percent: input.value,
    };
  }

  if (input.value > input.cashPrice) {
    return { amount: null, percent: null };
  }

  return {
    amount: Math.round(input.value),
    percent: Math.round((input.value / input.cashPrice) * 10000) / 100,
  };
}

export function computeFinancingPrincipal(input: {
  cashPrice: number;
  downPayment?: number | null;
}): number {
  const downPayment = input.downPayment ?? 0;

  return Math.max(0, input.cashPrice - downPayment);
}

export function computeFinancingMonthlyPayment(input: {
  aprPercent?: number | null;
  cashPrice: number;
  downPayment?: number | null;
  termYears: number;
}): number {
  const principal = computeFinancingPrincipal({
    cashPrice: input.cashPrice,
    downPayment: input.downPayment,
  });
  const months = input.termYears * 12;

  if (months <= 0 || principal <= 0) {
    return 0;
  }

  const apr = input.aprPercent ?? 0;

  if (apr <= 0) {
    return Math.ceil(principal / months);
  }

  const monthlyRate = apr / 100 / 12;
  const compounded = (1 + monthlyRate) ** months;
  const payment = (principal * monthlyRate * compounded) / (compounded - 1);

  return Math.ceil(payment);
}

export function computeInstallmentTotal(input: {
  monthlyPayment: number;
  termMonths: number;
}): number {
  if (input.termMonths <= 0 || input.monthlyPayment <= 0) {
    return 0;
  }

  return Number((input.monthlyPayment * input.termMonths).toFixed(2));
}

export function computeFinancingTotalPayable(input: {
  downPayment?: number | null;
  monthlyPayment: number;
  termMonths: number;
}): number {
  return (input.downPayment ?? 0) + computeInstallmentTotal(input);
}

export function buildFinancingTermsFromSelection(input: {
  aprPercent?: number | null;
  cashPrice: number | null;
  downPayment?: number | null;
  downPaymentPercent?: number | null;
  selectedTermYears: number[];
}): VehicleFinancingTerm[] {
  if (input.cashPrice === null || input.cashPrice <= 0) {
    return [];
  }

  const downPayment =
    input.downPayment ??
    computeDownPaymentFromPercent(input.cashPrice, input.downPaymentPercent ?? null);

  const uniqueYears = [...new Set(input.selectedTermYears)]
    .filter((year) => Number.isInteger(year) && year >= 1 && year <= 10)
    .sort((left, right) => left - right);

  return uniqueYears.map((termYears) => ({
    monthly_payment: computeFinancingMonthlyPayment({
      aprPercent: input.aprPercent,
      cashPrice: input.cashPrice as number,
      downPayment,
      termYears,
    }),
    term_years: termYears,
  }));
}

export function formatFinancingTermsSummary(
  terms: VehicleFinancingTerm[],
  formatter: (value: number) => string,
): string {
  if (terms.length === 0) {
    return "N/A";
  }

  return terms
    .map(
      (term) =>
        `${term.term_years} year${term.term_years === 1 ? "" : "s"} — ${formatter(term.monthly_payment)}/mo`,
    )
    .join(", ");
}

export function mergeSaleInclusions(input: {
  dealershipDefaults: string[];
  vehicleInclusions: string[];
}): string[] {
  const merged = new Set<string>();

  for (const item of [...input.dealershipDefaults, ...input.vehicleInclusions]) {
    const trimmed = item.trim();

    if (trimmed) {
      merged.add(trimmed);
    }
  }

  return [...merged];
}

export function getVehiclePostDefaultsFromDealership(input: {
  default_financing_headline: string | null;
  default_post_location_tag: string | null;
  default_sale_inclusions: string[] | null;
}): VehiclePostDefaults {
  return {
    defaultFinancingHeadline: input.default_financing_headline?.trim() || null,
    defaultPostLocationTag: input.default_post_location_tag?.trim() || null,
    defaultSaleInclusions: input.default_sale_inclusions ?? [],
  };
}
