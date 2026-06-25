import type {
  SalePayment,
  SalePaymentPlan,
  SalePaymentPlanStatus,
  SalePaymentPlanType,
  SalePaymentScheduleItem,
  SalePaymentScheduleItemInsert,
  SaleLedgerSummary,
} from "@/features/sales/types";
import { computeInstallmentTotal } from "@/features/vehicles/pricing";

export function calculateCollectedAtClosing(
  plan: Pick<SalePaymentPlan, "down_payment_amount" | "trade_in_amount">,
): number {
  return plan.down_payment_amount + (plan.trade_in_amount ?? 0);
}

export function calculateLedgerSummary(input: {
  plan: Pick<
    SalePaymentPlan,
    | "down_payment_amount"
    | "monthly_payment"
    | "plan_type"
    | "term_months"
    | "total_amount"
    | "trade_in_amount"
  >;
  postedPayments: Array<Pick<SalePayment, "amount">>;
  scheduleItems: SalePaymentScheduleItem[];
}): SaleLedgerSummary {
  const collectedAtClosing = calculateCollectedAtClosing(input.plan);
  const ledgerPaid = input.postedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidToDate = collectedAtClosing + ledgerPaid;
  const usesInstallmentBalance =
    (input.plan.plan_type === "financing" || input.plan.plan_type === "mixed") &&
    input.plan.monthly_payment !== null &&
    input.plan.term_months !== null &&
    input.plan.monthly_payment > 0 &&
    input.plan.term_months > 0;
  const installmentObligation = usesInstallmentBalance
    ? computeInstallmentTotal({
        monthlyPayment: input.plan.monthly_payment as number,
        termMonths: input.plan.term_months as number,
      })
    : Math.max(0, input.plan.total_amount - collectedAtClosing);
  const balanceRemaining = usesInstallmentBalance
    ? Math.max(0, installmentObligation - ledgerPaid)
    : Math.max(0, input.plan.total_amount - paidToDate);
  const now = Date.now();
  const hasOverdueSchedule = input.scheduleItems.some(
    (item) =>
      (item.status === "pending" || item.status === "overdue") &&
      new Date(item.due_at).getTime() < now &&
      balanceRemaining > 0,
  );

  return {
    balanceRemaining,
    collectedAtClosing,
    hasOverdueSchedule,
    ledgerPaid,
    paidToDate,
  };
}

export function derivePlanStatusFromLedger(input: {
  balanceRemaining: number;
  collectedAtClosing: number;
  hasOverdueSchedule: boolean;
  ledgerPaid: number;
  planType: SalePaymentPlanType;
}): SalePaymentPlanStatus {
  if (input.planType === "cash" && input.balanceRemaining <= 0) {
    return "paid_in_full";
  }

  if (input.balanceRemaining <= 0) {
    return "paid_in_full";
  }

  if (input.hasOverdueSchedule) {
    return "overdue";
  }

  if (input.ledgerPaid > 0 || input.collectedAtClosing > 0) {
    return "partially_paid";
  }

  return "pending";
}

export function buildPaymentScheduleItems(input: {
  dealershipId: string;
  plan: Pick<
    SalePaymentPlan,
    "down_payment_amount" | "id" | "monthly_payment" | "term_months" | "total_amount" | "trade_in_amount"
  >;
  soldAt: string;
}): SalePaymentScheduleItemInsert[] {
  if (!input.plan.term_months || input.plan.term_months <= 0) {
    return [];
  }

  const financedAmount = Math.max(
    0,
    input.plan.total_amount -
      input.plan.down_payment_amount -
      (input.plan.trade_in_amount ?? 0),
  );
  const amountPerMonth =
    input.plan.monthly_payment ?? financedAmount / input.plan.term_months;
  const startDate = new Date(input.soldAt);

  return Array.from({ length: input.plan.term_months }, (_, index) => {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + index + 1);

    return {
      amount_due: Number(amountPerMonth.toFixed(2)),
      dealership_id: input.dealershipId,
      due_at: dueDate.toISOString(),
      plan_id: input.plan.id,
      status: "pending",
    };
  });
}

export function getScheduleAllocationUpdates(input: {
  paymentAmount: number;
  paymentId: string;
  scheduleItems: SalePaymentScheduleItem[];
}): Array<{
  id: string;
  paid_payment_id: string;
  status: "paid";
}> {
  let remaining = input.paymentAmount;
  const updates: Array<{
    id: string;
    paid_payment_id: string;
    status: "paid";
  }> = [];
  const openItems = [...input.scheduleItems]
    .filter((item) => item.status === "pending" || item.status === "overdue")
    .sort((left, right) => left.due_at.localeCompare(right.due_at));

  for (const item of openItems) {
    if (remaining + 0.009 < item.amount_due) {
      break;
    }

    updates.push({
      id: item.id,
      paid_payment_id: input.paymentId,
      status: "paid",
    });
    remaining -= item.amount_due;
  }

  return updates;
}

export function getOverdueScheduleItemIds(
  scheduleItems: SalePaymentScheduleItem[],
  balanceRemaining: number,
): string[] {
  if (balanceRemaining <= 0) {
    return [];
  }

  const now = Date.now();

  return scheduleItems
    .filter(
      (item) =>
        item.status === "pending" && new Date(item.due_at).getTime() < now,
    )
    .map((item) => item.id);
}
