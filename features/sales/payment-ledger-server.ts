import "server-only";

import {
  buildPaymentScheduleItems,
  calculateLedgerSummary,
  derivePlanStatusFromLedger,
  getOverdueScheduleItemIds,
  getScheduleAllocationUpdates,
} from "@/features/sales/payment-ledger";
import type {
  SalePayment,
  SalePaymentPlan,
  SalePaymentScheduleItem,
} from "@/features/sales/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function syncPaymentScheduleForPlan(input: {
  dealershipId: string;
  plan: SalePaymentPlan;
  soldAt: string;
}): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: existingItems } = await adminSupabase
    .from("sale_payment_schedule_items")
    .select("id, status")
    .eq("dealership_id", input.dealershipId)
    .eq("plan_id", input.plan.id);

  if ((existingItems ?? []).some((item) => item.status === "paid")) {
    return;
  }

  await adminSupabase
    .from("sale_payment_schedule_items")
    .delete()
    .eq("dealership_id", input.dealershipId)
    .eq("plan_id", input.plan.id);

  const scheduleItems = buildPaymentScheduleItems({
    dealershipId: input.dealershipId,
    plan: input.plan,
    soldAt: input.soldAt,
  });

  if (scheduleItems.length === 0) {
    return;
  }

  await adminSupabase.from("sale_payment_schedule_items").insert(scheduleItems);
}

export async function reconcileSalePaymentPlan(input: {
  dealershipId: string;
  payments: SalePayment[];
  plan: SalePaymentPlan;
  scheduleItems: SalePaymentScheduleItem[];
}): Promise<SalePaymentPlan> {
  const adminSupabase = createSupabaseAdminClient();
  const postedPayments = input.payments.filter((payment) => payment.status === "posted");
  const summary = calculateLedgerSummary({
    plan: input.plan,
    postedPayments,
    scheduleItems: input.scheduleItems,
  });
  const overdueItemIds = getOverdueScheduleItemIds(
    input.scheduleItems,
    summary.balanceRemaining,
  );

  if (overdueItemIds.length > 0) {
    await adminSupabase
      .from("sale_payment_schedule_items")
      .update({ status: "overdue" })
      .eq("dealership_id", input.dealershipId)
      .in("id", overdueItemIds);
  }

  const status = derivePlanStatusFromLedger({
    balanceRemaining: summary.balanceRemaining,
    collectedAtClosing: summary.collectedAtClosing,
    hasOverdueSchedule: summary.hasOverdueSchedule || overdueItemIds.length > 0,
    ledgerPaid: summary.ledgerPaid,
    planType: input.plan.plan_type,
  });
  const { data, error } = await adminSupabase
    .from("sale_payment_plans")
    .update({
      balance_remaining: summary.balanceRemaining,
      status,
    })
    .eq("dealership_id", input.dealershipId)
    .eq("id", input.plan.id)
    .select("*")
    .single<SalePaymentPlan>();

  if (error || !data) {
    throw new Error("Unable to reconcile payment plan.");
  }

  return data;
}

export async function allocateSalePaymentToSchedule(input: {
  dealershipId: string;
  paymentAmount: number;
  paymentId: string;
  planId: string;
}): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: scheduleItems } = await adminSupabase
    .from("sale_payment_schedule_items")
    .select("*")
    .eq("dealership_id", input.dealershipId)
    .eq("plan_id", input.planId)
    .order("due_at", { ascending: true });

  const updates = getScheduleAllocationUpdates({
    paymentAmount: input.paymentAmount,
    paymentId: input.paymentId,
    scheduleItems: (scheduleItems ?? []) as SalePaymentScheduleItem[],
  });

  await Promise.all(
    updates.map((update) =>
      adminSupabase
        .from("sale_payment_schedule_items")
        .update({
          paid_payment_id: update.paid_payment_id,
          status: update.status,
        })
        .eq("dealership_id", input.dealershipId)
        .eq("id", update.id),
    ),
  );
}

export async function releaseSalePaymentScheduleAllocations(input: {
  dealershipId: string;
  paymentId: string;
}): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: linkedItems } = await adminSupabase
    .from("sale_payment_schedule_items")
    .select("id, due_at")
    .eq("dealership_id", input.dealershipId)
    .eq("paid_payment_id", input.paymentId);

  const now = Date.now();

  await Promise.all(
    (linkedItems ?? []).map((item) =>
      adminSupabase
        .from("sale_payment_schedule_items")
        .update({
          paid_payment_id: null,
          status: new Date(item.due_at).getTime() < now ? "overdue" : "pending",
        })
        .eq("dealership_id", input.dealershipId)
        .eq("id", item.id),
    ),
  );
}
