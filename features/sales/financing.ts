import {
  computeFinancingMonthlyPayment,
  computeFinancingPrincipal,
  resolveDownPaymentAmount,
  type DownPaymentInputMode,
} from "@/features/vehicles/pricing";

export type ResolvedSaleFinancing = {
  aprPercent: number;
  downPaymentAmount: number;
  financedAmount: number;
  monthlyPayment: number;
  termMonths: number;
  termYears: number;
};

export function resolveSaleFinancingDetails(input: {
  aprPercent: number | null;
  downPaymentInputMode: DownPaymentInputMode | null;
  downPaymentValue: number | null;
  planTbd: boolean;
  soldPrice: number;
  termYears: number | null;
}): ResolvedSaleFinancing | null {
  if (input.planTbd || input.termYears === null || input.downPaymentValue === null) {
    return null;
  }

  const downPayment = resolveDownPaymentAmount({
    cashPrice: input.soldPrice,
    mode: input.downPaymentInputMode ?? "amount",
    value: input.downPaymentValue,
  });

  if (downPayment.amount === null) {
    return null;
  }

  const aprPercent = input.aprPercent ?? 0;
  const monthlyPayment = computeFinancingMonthlyPayment({
    aprPercent,
    cashPrice: input.soldPrice,
    downPayment: downPayment.amount,
    termYears: input.termYears,
  });
  const termMonths = input.termYears * 12;
  const financedAmount = computeFinancingPrincipal({
    cashPrice: input.soldPrice,
    downPayment: downPayment.amount,
  });

  return {
    aprPercent,
    downPaymentAmount: downPayment.amount,
    financedAmount,
    monthlyPayment,
    termMonths,
    termYears: input.termYears,
  };
}
