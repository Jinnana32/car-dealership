import type {
  SalePaymentPlanInsert,
  SalePaymentPlanStatus,
  SalePaymentPlanType,
  VehicleSalePaymentType,
} from "@/features/sales/types";
import { computeInstallmentTotal } from "@/features/vehicles/pricing";

export type BuildSalePaymentPlanInput = {
  aprPercent?: number | null;
  downPaymentAmount: number | null;
  financierName: string | null;
  monthlyPayment: number | null;
  notes: string | null;
  paymentType: VehicleSalePaymentType;
  planTbd: boolean;
  soldPrice: number;
  termMonths: number | null;
  tradeInAmount: number | null;
};

export function derivePlanTypeFromPaymentType(
  paymentType: VehicleSalePaymentType,
): SalePaymentPlanType {
  if (paymentType === "financing") {
    return "financing";
  }

  if (paymentType === "trade_in") {
    return "trade_in";
  }

  if (paymentType === "other") {
    return "mixed";
  }

  return "cash";
}

export function deriveSalePaymentPlanStatus(input: {
  balanceRemaining: number;
  collectedAtClosing: number;
  paymentType: VehicleSalePaymentType;
  planTbd: boolean;
}): SalePaymentPlanStatus {
  if (input.paymentType === "cash" || input.paymentType === null) {
    return "paid_in_full";
  }

  if (input.planTbd) {
    return "pending";
  }

  if (input.balanceRemaining <= 0) {
    return "paid_in_full";
  }

  if (input.collectedAtClosing > 0) {
    return "partially_paid";
  }

  return "pending";
}

export function buildSalePaymentPlanInsert(input: {
  dealershipId: string;
  plan: BuildSalePaymentPlanInput;
  saleId: string;
}): SalePaymentPlanInsert {
  const planType = derivePlanTypeFromPaymentType(input.plan.paymentType);
  const totalAmount = input.plan.soldPrice;
  const downPaymentAmount =
    planType === "cash" ? totalAmount : input.plan.downPaymentAmount ?? 0;
  const tradeInAmount = input.plan.tradeInAmount;
  const collectedAtClosing = downPaymentAmount + (tradeInAmount ?? 0);
  const principalBalance = Math.max(0, totalAmount - collectedAtClosing);
  const installmentBalance =
    (planType === "financing" || planType === "mixed") &&
    input.plan.monthlyPayment !== null &&
    input.plan.termMonths !== null &&
    input.plan.monthlyPayment > 0 &&
    input.plan.termMonths > 0 &&
    !input.plan.planTbd
      ? computeInstallmentTotal({
          monthlyPayment: input.plan.monthlyPayment,
          termMonths: input.plan.termMonths,
        })
      : principalBalance;
  const balanceRemaining = input.plan.planTbd ? principalBalance : installmentBalance;
  const financedAmount =
    planType === "financing" || planType === "mixed" ? principalBalance : null;
  const status = deriveSalePaymentPlanStatus({
    balanceRemaining,
    collectedAtClosing,
    paymentType: input.plan.paymentType,
    planTbd: input.plan.planTbd,
  });

  return {
    apr_percent: input.plan.aprPercent ?? null,
    balance_remaining: balanceRemaining,
    dealership_id: input.dealershipId,
    down_payment_amount: downPaymentAmount,
    financed_amount: financedAmount,
    financier_name: input.plan.financierName,
    monthly_payment: input.plan.monthlyPayment,
    notes: input.plan.notes,
    plan_type: planType,
    sale_id: input.saleId,
    status,
    term_months: input.plan.termMonths,
    total_amount: totalAmount,
    trade_in_amount: tradeInAmount,
  };
}
