"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { z } from "zod";

import type { Inquiry, InquiryInsert } from "@/features/inquiries/types";
import { searchPossibleCustomerDuplicatesInDealership } from "@/features/inquiries/queries";
import { buildCustomerNameParts } from "@/features/inquiries/utils";
import type { CustomerInsert } from "@/features/customers/types";
import { buildSalePaymentPlanInsert } from "@/features/sales/payment-plan";
import { resolveSaleFinancingDetails } from "@/features/sales/financing";
import { calculateLedgerSummary } from "@/features/sales/payment-ledger";
import {
  allocateSalePaymentToSchedule,
  reconcileSalePaymentPlan,
  releaseSalePaymentScheduleAllocations,
  syncPaymentScheduleForPlan,
} from "@/features/sales/payment-ledger-server";
import { canAccessSaleRecord, mapVehicleSaleRecords } from "@/features/sales/queries";
import {
  recordQuickSaleSchema,
  recordSalePaymentSchema,
  recordVehicleSaleSchema,
  updateSalePaymentPlanSchema,
  voidSalePaymentSchema,
} from "@/features/sales/validators";
import { canCreateLeads, canManageDealership, canRecordSales } from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import type { AdminAccessContext } from "@/lib/auth/types";
import { redirectWithMessage } from "@/lib/redirect";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { Vehicle } from "@/features/vehicles/types";
import type { Customer } from "@/features/customers/types";
import type {
  RecordVehicleSaleFormState,
  RecordVehicleSaleFormValues,
  SalePayment,
  SalePaymentPlan,
  SalePaymentPlanUpdate,
  SalePaymentScheduleItem,
  VehicleSale,
  VehicleSaleInsert,
} from "@/features/sales/types";

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function extractSalePlanFormFields(formData: FormData) {
  return {
    down_payment_amount: formData.get("down_payment_amount"),
    down_payment_input_mode: formData.get("down_payment_input_mode"),
    down_payment_value: formData.get("down_payment_value"),
    financier_name: formData.get("financier_name"),
    monthly_payment: formData.get("monthly_payment"),
    plan_tbd: formData.get("plan_tbd"),
    term_months: formData.get("term_months"),
    term_years: formData.get("term_years"),
    trade_in_amount: formData.get("trade_in_amount"),
  };
}

function extractRecordVehicleSaleFormValues(formData: FormData): RecordVehicleSaleFormValues {
  return {
    asking_price: getStringValue(formData, "asking_price"),
    confirm: getStringValue(formData, "confirm"),
    customer_id: getStringValue(formData, "customer_id"),
    down_payment_amount: getStringValue(formData, "down_payment_amount"),
    down_payment_input_mode: getStringValue(formData, "down_payment_input_mode"),
    down_payment_value: getStringValue(formData, "down_payment_value"),
    financier_name: getStringValue(formData, "financier_name"),
    inquiry_id: getStringValue(formData, "inquiry_id"),
    monthly_payment: getStringValue(formData, "monthly_payment"),
    notes: getStringValue(formData, "notes"),
    payment_type: getStringValue(formData, "payment_type"),
    plan_tbd: getStringValue(formData, "plan_tbd"),
    redirect_to: getStringValue(formData, "redirect_to"),
    sold_at: getStringValue(formData, "sold_at"),
    sold_price: getStringValue(formData, "sold_price"),
    term_months: getStringValue(formData, "term_months"),
    term_years: getStringValue(formData, "term_years"),
    trade_in_amount: getStringValue(formData, "trade_in_amount"),
    vehicle_id: getStringValue(formData, "vehicle_id"),
  };
}

function getValidationErrors(error: ZodError): {
  fieldErrors: Record<string, string[] | undefined>;
  formErrors: string[];
} {
  const flattened = error.flatten();
  const formErrors =
    flattened.formErrors.length > 0
      ? flattened.formErrors
      : Array.from(new Set(error.issues.map((issue) => issue.message)));

  return {
    fieldErrors: flattened.fieldErrors,
    formErrors,
  };
}

type RecordVehicleSaleParsed = z.infer<typeof recordVehicleSaleSchema>;

type RecordVehicleSaleExecutionResult =
  | {
      inquiryId: string | null;
      ok: true;
      saleId: string;
      vehicleId: string;
      vehicleSlug: string;
    }
  | { error: string; ok: false };

const initialRecordVehicleSaleFormState: RecordVehicleSaleFormState = {
  fieldErrors: {},
};

function buildSalePlanInputFromParsed(
  access: AdminAccessContext,
  parsed: {
    down_payment_amount: number | null;
    down_payment_input_mode: "amount" | "percent";
    down_payment_value: number | null;
    financier_name: string | null;
    monthly_payment: number | null;
    notes: string | null;
    payment_type: VehicleSale["payment_type"];
    plan_tbd: boolean;
    sold_price: number;
    term_months: number | null;
    term_years: number | null;
    trade_in_amount: number | null;
  },
) {
  const financing = resolveSaleFinancingDetails({
    aprPercent: access.dealership.default_financing_apr_percent,
    downPaymentInputMode: parsed.down_payment_input_mode,
    downPaymentValue: parsed.down_payment_value ?? parsed.down_payment_amount,
    planTbd: parsed.plan_tbd,
    soldPrice: parsed.sold_price,
    termYears:
      parsed.term_years ??
      (parsed.term_months && parsed.term_months % 12 === 0
        ? parsed.term_months / 12
        : null),
  });
  const isFinancing =
    parsed.payment_type === "financing" || parsed.payment_type === "other";

  return {
    aprPercent: financing?.aprPercent ?? null,
    downPaymentAmount: financing?.downPaymentAmount ?? parsed.down_payment_amount,
    financierName:
      parsed.financier_name ||
      (isFinancing && !parsed.plan_tbd ? access.dealership.name : null),
    monthlyPayment: financing?.monthlyPayment ?? parsed.monthly_payment,
    notes: parsed.notes,
    paymentType: parsed.payment_type,
    planTbd: parsed.plan_tbd,
    soldPrice: parsed.sold_price,
    termMonths: financing?.termMonths ?? parsed.term_months,
    tradeInAmount: parsed.trade_in_amount,
  };
}

function sanitizeRedirectPath(
  candidate: string | undefined,
  fallback: string,
): string {
  if (
    !candidate ||
    (!candidate.startsWith("/admin/inquiries") &&
      !candidate.startsWith("/admin/vehicles") &&
      !candidate.startsWith("/admin/pipeline") &&
      !candidate.startsWith("/admin/reports") &&
      !candidate.startsWith("/admin/sales"))
  ) {
    return fallback;
  }

  return candidate;
}

async function getAccessibleVehicle(
  access: AdminAccessContext,
  vehicleId: string,
): Promise<Vehicle | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicleId)
    .maybeSingle<Vehicle>();

  return data ?? null;
}

async function getAccessibleInquiry(
  access: AdminAccessContext,
  inquiryId: string | null,
): Promise<Inquiry | null> {
  if (!inquiryId) {
    return null;
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("inquiries")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiryId)
    .maybeSingle<Inquiry>();

  return data ?? null;
}

async function getAccessibleCustomer(
  access: AdminAccessContext,
  customerId: string | null,
): Promise<Pick<Customer, "full_name" | "id"> | null> {
  if (!customerId) {
    return null;
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("customers")
    .select("id, full_name")
    .eq("dealership_id", access.dealership.id)
    .eq("id", customerId)
    .maybeSingle<Pick<Customer, "full_name" | "id">>();

  return data ?? null;
}

function canCreateSaleForContext(input: {
  access: AdminAccessContext;
  inquiry: Inquiry | null;
}): boolean {
  if (canManageDealership(input.access.membership.role)) {
    return true;
  }

  if (input.access.membership.role !== "sales_agent") {
    return false;
  }

  return input.inquiry?.assigned_to === input.access.profile.id;
}

function revalidateSalesSurfaces(input: {
  dealershipSlug: string;
  inquiryId: string | null;
  redirectPath: string;
  saleId?: string | null;
  vehicleId: string;
  vehicleSlug: string;
}): void {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/reports/sales");
  revalidatePath("/admin/reports/inventory");
  revalidatePath("/admin/reports/inquiries");
  revalidatePath("/admin/reports/lead-sources");
  revalidatePath("/admin/reports/pipeline");
  revalidatePath(input.redirectPath);
  revalidatePath(`/admin/vehicles/${input.vehicleId}`);

  if (input.inquiryId) {
    revalidatePath(`/admin/inquiries/${input.inquiryId}`);
  }

  if (input.saleId) {
    revalidatePath(`/admin/sales/${input.saleId}`);
  }

  revalidatePath(`/${input.dealershipSlug}`);
  revalidatePath(`/${input.dealershipSlug}/vehicles`);
  revalidatePath(`/${input.dealershipSlug}/vehicles/${input.vehicleSlug}`);
}

async function executeRecordVehicleSale(
  access: AdminAccessContext,
  parsed: RecordVehicleSaleParsed,
): Promise<RecordVehicleSaleExecutionResult> {
  const [vehicle, inquiry] = await Promise.all([
    getAccessibleVehicle(access, parsed.vehicle_id),
    getAccessibleInquiry(access, parsed.inquiry_id),
  ]);

  if (!vehicle) {
    return { error: "Vehicle not found or not accessible.", ok: false };
  }

  if (!canCreateSaleForContext({ access, inquiry })) {
    return { error: "You do not have permission to record this sale.", ok: false };
  }

  if (vehicle.status === "sold" || vehicle.availability === "sold") {
    return { error: "This vehicle is already marked as sold.", ok: false };
  }

  if (inquiry && inquiry.status === "lost") {
    return { error: "A lost inquiry cannot be used to record a sale.", ok: false };
  }

  if (inquiry && inquiry.vehicle_id && inquiry.vehicle_id !== vehicle.id) {
    return {
      error: "The selected inquiry is linked to a different vehicle.",
      ok: false,
    };
  }

  const fallbackCustomerId = inquiry?.customer_id ?? null;
  const selectedCustomerId = parsed.customer_id ?? fallbackCustomerId;

  if (inquiry && parsed.customer_id && parsed.customer_id !== inquiry.customer_id) {
    return {
      error: "The selected customer does not match the selected inquiry.",
      ok: false,
    };
  }

  const customer = await getAccessibleCustomer(access, selectedCustomerId);

  if (selectedCustomerId && !customer) {
    return { error: "Customer not found or not accessible.", ok: false };
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: existingSale } = await adminSupabase
    .from("vehicle_sales")
    .select("id")
    .eq("dealership_id", access.dealership.id)
    .eq("vehicle_id", vehicle.id)
    .maybeSingle<Pick<VehicleSale, "id">>();

  if (existingSale) {
    return { error: "A sale record already exists for this vehicle.", ok: false };
  }

  const salePayload: VehicleSaleInsert = {
    asking_price: parsed.asking_price ?? vehicle.price,
    created_by: access.profile.id,
    customer_id: customer?.id ?? null,
    dealership_id: access.dealership.id,
    inquiry_id: inquiry?.id ?? null,
    notes: parsed.notes,
    payment_type: parsed.payment_type,
    sold_at: new Date(parsed.sold_at).toISOString(),
    sold_price: parsed.sold_price,
    vehicle_id: vehicle.id,
  };
  const { data: saleRecord, error: saleError } = await adminSupabase
    .from("vehicle_sales")
    .insert(salePayload)
    .select("*")
    .single<VehicleSale>();

  if (saleError || !saleRecord) {
    return { error: "Unable to create the sale record right now.", ok: false };
  }

  const paymentPlanPayload = buildSalePaymentPlanInsert({
    dealershipId: access.dealership.id,
    plan: buildSalePlanInputFromParsed(access, parsed),
    saleId: saleRecord.id,
  });
  const { data: paymentPlan, error: paymentPlanError } = await adminSupabase
    .from("sale_payment_plans")
    .insert(paymentPlanPayload)
    .select("*")
    .single<SalePaymentPlan>();

  if (paymentPlanError || !paymentPlan) {
    return {
      error: "The sale was recorded, but the payment plan could not be created.",
      ok: false,
    };
  }

  await adminSupabase.from("sale_payment_plan_events").insert({
    created_by: access.profile.id,
    dealership_id: access.dealership.id,
    event_type: "created",
    metadata: {
      payment_type: parsed.payment_type,
      plan_tbd: parsed.plan_tbd,
      sale_id: saleRecord.id,
      status: paymentPlan.status,
    } satisfies Json,
    plan_id: paymentPlan.id,
  });

  await syncPaymentScheduleForPlan({
    dealershipId: access.dealership.id,
    plan: paymentPlan,
    soldAt: saleRecord.sold_at,
  });

  const { error: vehicleError } = await adminSupabase
    .from("vehicles")
    .update({
      availability: "sold",
      status: "sold",
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicle.id);

  if (vehicleError) {
    return {
      error: "The sale was recorded, but the vehicle status could not be updated.",
      ok: false,
    };
  }

  if (inquiry) {
    const { error: inquiryError } = await adminSupabase
      .from("inquiries")
      .update({
        lost_reason: null,
        status: "won",
        vehicle_id: inquiry.vehicle_id ?? vehicle.id,
      })
      .eq("dealership_id", access.dealership.id)
      .eq("id", inquiry.id);

    if (inquiryError) {
      return {
        error: "The sale was recorded, but the inquiry could not be closed as won.",
        ok: false,
      };
    }

    await adminSupabase.from("inquiry_events").insert({
      created_by: access.profile.id,
      dealership_id: access.dealership.id,
      event_type: "marked_won",
      inquiry_id: inquiry.id,
      metadata: {
        sale_id: saleRecord.id,
        sold_price: String(saleRecord.sold_price),
        vehicle_id: vehicle.id,
      } satisfies Json,
      new_status: "won",
      note: "Inquiry marked as won and sale recorded.",
      old_status: inquiry.status,
    });
  }

  return {
    inquiryId: inquiry?.id ?? null,
    ok: true,
    saleId: saleRecord.id,
    vehicleId: vehicle.id,
    vehicleSlug: vehicle.slug,
  };
}

function parseRecordVehicleSaleFormData(formData: FormData) {
  return recordVehicleSaleSchema.safeParse({
    asking_price: formData.get("asking_price"),
    confirm: formData.get("confirm"),
    customer_id: formData.get("customer_id"),
    inquiry_id: formData.get("inquiry_id"),
    notes: formData.get("notes"),
    payment_type: formData.get("payment_type"),
    redirect_to: formData.get("redirect_to"),
    sold_at: formData.get("sold_at"),
    sold_price: formData.get("sold_price"),
    vehicle_id: formData.get("vehicle_id"),
    ...extractSalePlanFormFields(formData),
  });
}

export async function recordVehicleSale(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    "/admin/inquiries",
  );
  const access = await requireAdminAccessContext("/admin/inquiries");

  if (!access || !canRecordSales(access.membership.role)) {
    redirectWithMessage(redirectPath, "error", "You do not have permission to record a sale.");
  }

  const parsed = parseRecordVehicleSaleFormData(formData);

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      parsed.error.issues[0]?.message ?? "Enter valid sale details.",
    );
  }

  const result = await executeRecordVehicleSale(access, parsed.data);

  if (!result.ok) {
    redirectWithMessage(redirectPath, "error", result.error);
  }

  revalidateSalesSurfaces({
    dealershipSlug: access.dealership.slug,
    inquiryId: result.inquiryId,
    redirectPath,
    saleId: result.saleId,
    vehicleId: result.vehicleId,
    vehicleSlug: result.vehicleSlug,
  });
  redirectWithMessage(redirectPath, "success", "Sale recorded successfully.");
}

export async function recordVehicleSaleInPanel(
  previousState: RecordVehicleSaleFormState = initialRecordVehicleSaleFormState,
  formData: FormData,
): Promise<RecordVehicleSaleFormState> {
  void previousState;

  const values = extractRecordVehicleSaleFormValues(formData);
  const redirectPath = sanitizeRedirectPath(values.redirect_to || undefined, "/admin/pipeline");
  const access = await requireAdminAccessContext("/admin/pipeline");

  if (!access || !canRecordSales(access.membership.role)) {
    return {
      error: "You do not have permission to record a sale.",
      fieldErrors: {},
      values,
    };
  }

  const parsed = parseRecordVehicleSaleFormData(formData);

  if (!parsed.success) {
    const validationErrors = getValidationErrors(parsed.error);

    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: validationErrors.fieldErrors,
      formErrors: validationErrors.formErrors,
      values,
    };
  }

  const result = await executeRecordVehicleSale(access, parsed.data);

  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: {},
      values,
    };
  }

  revalidateSalesSurfaces({
    dealershipSlug: access.dealership.slug,
    inquiryId: result.inquiryId,
    redirectPath,
    saleId: result.saleId,
    vehicleId: result.vehicleId,
    vehicleSlug: result.vehicleSlug,
  });

  return {
    fieldErrors: {},
    message: "Sale recorded successfully.",
    success: true,
    values,
  };
}

export async function updateSalePaymentPlan(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    "/admin/sales",
  );
  const access = await requireAdminAccessContext("/admin/sales");

  if (!access || !canManageDealership(access.membership.role)) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to update payment plans.",
    );
  }

  const parsed = updateSalePaymentPlanSchema.safeParse({
    down_payment_amount: formData.get("down_payment_amount"),
    financier_name: formData.get("financier_name"),
    monthly_payment: formData.get("monthly_payment"),
    plan_id: formData.get("plan_id"),
    plan_tbd: formData.get("plan_tbd"),
    redirect_to: formData.get("redirect_to"),
    sale_id: formData.get("sale_id"),
    term_months: formData.get("term_months"),
    total_amount: formData.get("total_amount"),
    trade_in_amount: formData.get("trade_in_amount"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      parsed.error.issues[0]?.message ?? "Enter valid payment plan details.",
    );
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: existingPlan } = await adminSupabase
    .from("sale_payment_plans")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.plan_id)
    .eq("sale_id", parsed.data.sale_id)
    .maybeSingle<SalePaymentPlan>();

  if (!existingPlan) {
    redirectWithMessage(redirectPath, "error", "Payment plan not found.");
  }

  if (
    existingPlan.plan_type !== "financing" &&
    existingPlan.plan_type !== "mixed"
  ) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Only financing or mixed plans can be updated here.",
    );
  }

  const downPaymentAmount = parsed.data.down_payment_amount ?? 0;
  const tradeInAmount = parsed.data.trade_in_amount;
  const collectedAtClosing = downPaymentAmount + (tradeInAmount ?? 0);
  const balanceRemaining = Math.max(0, parsed.data.total_amount - collectedAtClosing);

  const updatePayload: SalePaymentPlanUpdate = {
    down_payment_amount: downPaymentAmount,
    financed_amount: balanceRemaining,
    financier_name: parsed.data.financier_name,
    monthly_payment: parsed.data.monthly_payment,
    term_months: parsed.data.term_months,
    total_amount: parsed.data.total_amount,
    trade_in_amount: tradeInAmount,
  };
  const { data: updatedPlan, error: updateError } = await adminSupabase
    .from("sale_payment_plans")
    .update(updatePayload)
    .eq("dealership_id", access.dealership.id)
    .eq("id", existingPlan.id)
    .select("*")
    .single<SalePaymentPlan>();

  if (updateError || !updatedPlan) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Unable to update the payment plan right now.",
    );
  }

  const { data: saleRecord } = await adminSupabase
    .from("vehicle_sales")
    .select("sold_at")
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.sale_id)
    .maybeSingle<Pick<VehicleSale, "sold_at">>();

  if (saleRecord) {
    await syncPaymentScheduleForPlan({
      dealershipId: access.dealership.id,
      plan: updatedPlan,
      soldAt: saleRecord.sold_at,
    });
  }

  const [{ data: payments }, { data: scheduleItems }] = await Promise.all([
    adminSupabase
      .from("sale_payments")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("sale_id", parsed.data.sale_id),
    adminSupabase
      .from("sale_payment_schedule_items")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("plan_id", updatedPlan.id)
      .order("due_at", { ascending: true }),
  ]);
  const reconciledPlan = await reconcileSalePaymentPlan({
    dealershipId: access.dealership.id,
    payments: (payments ?? []) as SalePayment[],
    plan: updatedPlan,
    scheduleItems: (scheduleItems ?? []) as SalePaymentScheduleItem[],
  });

  await adminSupabase.from("sale_payment_plan_events").insert({
    created_by: access.profile.id,
    dealership_id: access.dealership.id,
    event_type: "updated",
    metadata: {
      balance_remaining: reconciledPlan.balance_remaining,
      plan_tbd: parsed.data.plan_tbd,
      sale_id: parsed.data.sale_id,
      status: reconciledPlan.status,
    } satisfies Json,
    plan_id: existingPlan.id,
  });

  revalidatePath("/admin/sales");
  revalidatePath(`/admin/sales/${parsed.data.sale_id}`);
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Payment plan updated.");
}

export async function recordSalePayment(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    "/admin/sales",
  );
  const access = await requireAdminAccessContext("/admin/sales");

  if (!access || !canRecordSales(access.membership.role)) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to record payments.",
    );
  }

  const parsed = recordSalePaymentSchema.safeParse({
    allow_overpayment: formData.get("allow_overpayment"),
    amount: formData.get("amount"),
    notes: formData.get("notes"),
    override_note: formData.get("override_note"),
    paid_at: formData.get("paid_at"),
    payment_method: formData.get("payment_method"),
    plan_id: formData.get("plan_id"),
    redirect_to: formData.get("redirect_to"),
    reference_number: formData.get("reference_number"),
    sale_id: formData.get("sale_id"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      parsed.error.issues[0]?.message ?? "Enter valid payment details.",
    );
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: saleRecord } = await adminSupabase
    .from("vehicle_sales")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.sale_id)
    .maybeSingle<VehicleSale>();

  if (!saleRecord) {
    redirectWithMessage(redirectPath, "error", "Sale not found.");
  }

  const [mappedSale] = await mapVehicleSaleRecords(access, [saleRecord]);

  if (!mappedSale || !canAccessSaleRecord(access, mappedSale)) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to record a payment for this sale.",
    );
  }

  const paymentPlan = parsed.data.plan_id
    ? await adminSupabase
        .from("sale_payment_plans")
        .select("*")
        .eq("dealership_id", access.dealership.id)
        .eq("id", parsed.data.plan_id)
        .eq("sale_id", parsed.data.sale_id)
        .maybeSingle<SalePaymentPlan>()
        .then((response) => response.data)
    : await adminSupabase
        .from("sale_payment_plans")
        .select("*")
        .eq("dealership_id", access.dealership.id)
        .eq("sale_id", parsed.data.sale_id)
        .maybeSingle<SalePaymentPlan>()
        .then((response) => response.data);

  if (!paymentPlan) {
    redirectWithMessage(redirectPath, "error", "Payment plan not found for this sale.");
  }

  const { data: existingPayments } = await adminSupabase
    .from("sale_payments")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("sale_id", parsed.data.sale_id);
  const postedPayments = ((existingPayments ?? []) as SalePayment[]).filter(
    (payment) => payment.status === "posted",
  );
  const { data: scheduleItems } = await adminSupabase
    .from("sale_payment_schedule_items")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("plan_id", paymentPlan.id);
  const summary = calculateLedgerSummary({
    plan: paymentPlan,
    postedPayments,
    scheduleItems: (scheduleItems ?? []) as SalePaymentScheduleItem[],
  });

  if (
    parsed.data.amount > summary.balanceRemaining + 0.009 &&
    !parsed.data.allow_overpayment
  ) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Payment amount exceeds the remaining balance.",
    );
  }

  if (
    parsed.data.allow_overpayment &&
    !canManageDealership(access.membership.role)
  ) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Only owners and admins can record an overpayment.",
    );
  }

  const paymentNotes = [parsed.data.notes, parsed.data.override_note]
    .filter(Boolean)
    .join("\n\n");
  const { data: payment, error: paymentError } = await adminSupabase
    .from("sale_payments")
    .insert({
      amount: parsed.data.amount,
      dealership_id: access.dealership.id,
      notes: paymentNotes || null,
      paid_at: new Date(parsed.data.paid_at).toISOString(),
      payment_method: parsed.data.payment_method,
      plan_id: paymentPlan.id,
      recorded_by: access.profile.id,
      reference_number: parsed.data.reference_number,
      sale_id: parsed.data.sale_id,
      status: "posted",
    })
    .select("*")
    .single<SalePayment>();

  if (paymentError || !payment) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Unable to record the payment right now.",
    );
  }

  await allocateSalePaymentToSchedule({
    dealershipId: access.dealership.id,
    paymentAmount: payment.amount,
    paymentId: payment.id,
    planId: paymentPlan.id,
  });

  const { data: refreshedPayments } = await adminSupabase
    .from("sale_payments")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("sale_id", parsed.data.sale_id);
  const { data: refreshedScheduleItems } = await adminSupabase
    .from("sale_payment_schedule_items")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("plan_id", paymentPlan.id)
    .order("due_at", { ascending: true });

  await reconcileSalePaymentPlan({
    dealershipId: access.dealership.id,
    payments: (refreshedPayments ?? []) as SalePayment[],
    plan: paymentPlan,
    scheduleItems: (refreshedScheduleItems ?? []) as SalePaymentScheduleItem[],
  });

  revalidatePath("/admin/sales");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/sales/${parsed.data.sale_id}`);
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Payment recorded successfully.");
}

export async function voidSalePayment(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    "/admin/sales",
  );
  const access = await requireAdminAccessContext("/admin/sales");

  if (!access || !canManageDealership(access.membership.role)) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to void payments.",
    );
  }

  const parsed = voidSalePaymentSchema.safeParse({
    payment_id: formData.get("payment_id"),
    redirect_to: formData.get("redirect_to"),
    sale_id: formData.get("sale_id"),
    void_note: formData.get("void_note"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      parsed.error.issues[0]?.message ?? "Enter valid void details.",
    );
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: payment } = await adminSupabase
    .from("sale_payments")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.payment_id)
    .eq("sale_id", parsed.data.sale_id)
    .maybeSingle<SalePayment>();

  if (!payment || payment.status === "voided") {
    redirectWithMessage(redirectPath, "error", "Payment not found or already voided.");
  }

  const voidNotes = [payment.notes, parsed.data.void_note ? `Voided: ${parsed.data.void_note}` : null]
    .filter(Boolean)
    .join("\n\n");
  const { error: voidError } = await adminSupabase
    .from("sale_payments")
    .update({
      notes: voidNotes || payment.notes,
      status: "voided",
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", payment.id);

  if (voidError) {
    redirectWithMessage(redirectPath, "error", "Unable to void the payment right now.");
  }

  await releaseSalePaymentScheduleAllocations({
    dealershipId: access.dealership.id,
    paymentId: payment.id,
  });

  const { data: paymentPlan } = payment.plan_id
    ? await adminSupabase
        .from("sale_payment_plans")
        .select("*")
        .eq("dealership_id", access.dealership.id)
        .eq("id", payment.plan_id)
        .maybeSingle<SalePaymentPlan>()
    : await adminSupabase
        .from("sale_payment_plans")
        .select("*")
        .eq("dealership_id", access.dealership.id)
        .eq("sale_id", parsed.data.sale_id)
        .maybeSingle<SalePaymentPlan>();

  if (paymentPlan) {
    const [{ data: payments }, { data: scheduleItems }] = await Promise.all([
      adminSupabase
        .from("sale_payments")
        .select("*")
        .eq("dealership_id", access.dealership.id)
        .eq("sale_id", parsed.data.sale_id),
      adminSupabase
        .from("sale_payment_schedule_items")
        .select("*")
        .eq("dealership_id", access.dealership.id)
        .eq("plan_id", paymentPlan.id)
        .order("due_at", { ascending: true }),
    ]);

    await reconcileSalePaymentPlan({
      dealershipId: access.dealership.id,
      payments: (payments ?? []) as SalePayment[],
      plan: paymentPlan,
      scheduleItems: (scheduleItems ?? []) as SalePaymentScheduleItem[],
    });
  }

  revalidatePath("/admin/sales");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/sales/${parsed.data.sale_id}`);
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Payment voided.");
}

export async function recordQuickSale(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    "/admin/sales/new",
  );
  const access = await requireAdminAccessContext("/admin/sales/new");

  if (!access || !canRecordSales(access.membership.role)) {
    redirectWithMessage(redirectPath, "error", "You do not have permission to record a sale.");
  }

  const parsed = recordQuickSaleSchema.safeParse({
    asking_price: formData.get("asking_price"),
    confirm: formData.get("confirm"),
    customer_name: formData.get("customer_name"),
    email: formData.get("email"),
    existing_customer_id: formData.get("existing_customer_id"),
    notes: formData.get("notes"),
    payment_type: formData.get("payment_type"),
    phone: formData.get("phone"),
    redirect_to: formData.get("redirect_to"),
    sold_at: formData.get("sold_at"),
    sold_price: formData.get("sold_price"),
    vehicle_id: formData.get("vehicle_id"),
    ...extractSalePlanFormFields(formData),
  });

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      parsed.error.issues[0]?.message ?? "Enter valid walk-in sale details.",
    );
  }

  const vehicle = await getAccessibleVehicle(access, parsed.data.vehicle_id);

  if (!vehicle) {
    redirectWithMessage(redirectPath, "error", "Vehicle not found or not available.");
  }

  if (vehicle.status === "sold" || vehicle.availability === "sold") {
    redirectWithMessage(redirectPath, "error", "This vehicle is already marked as sold.");
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: existingSale } = await adminSupabase
    .from("vehicle_sales")
    .select("id")
    .eq("dealership_id", access.dealership.id)
    .eq("vehicle_id", vehicle.id)
    .maybeSingle<Pick<VehicleSale, "id">>();

  if (existingSale) {
    redirectWithMessage(redirectPath, "error", "A sale record already exists for this vehicle.");
  }

  let customerId = parsed.data.existing_customer_id;

  if (!customerId) {
    const duplicates = await searchPossibleCustomerDuplicatesInDealership(access, {
      customerName: parsed.data.customer_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
    });

    if (duplicates.length === 1) {
      customerId = duplicates[0]?.id ?? null;
    } else if (duplicates.length > 1) {
      redirectWithMessage(
        redirectPath,
        "error",
        "Multiple customers match this phone or email. Open Customers and link the correct record first.",
      );
    }
  }

  if (!customerId) {
    if (!canCreateLeads(access.membership.role)) {
      redirectWithMessage(
        redirectPath,
        "error",
        "You do not have permission to create a new customer.",
      );
    }

    const { firstName, lastName } = buildCustomerNameParts(parsed.data.customer_name);
    const customerPayload: CustomerInsert = {
      created_by: access.profile.id,
      dealership_id: access.dealership.id,
      email: parsed.data.email,
      first_name: firstName,
      full_name: parsed.data.customer_name,
      last_name: lastName,
      phone: parsed.data.phone,
      source_type: "walk_in",
    };
    const { data: customerRecord, error: customerError } = await adminSupabase
      .from("customers")
      .insert(customerPayload)
      .select("id")
      .single<Pick<Customer, "id">>();

    if (customerError || !customerRecord) {
      redirectWithMessage(redirectPath, "error", "Unable to create the customer right now.");
    }

    customerId = customerRecord.id;
  } else {
    const customer = await getAccessibleCustomer(access, customerId);

    if (!customer) {
      redirectWithMessage(redirectPath, "error", "Customer not found or not accessible.");
    }
  }

  const inquiryPayload: InquiryInsert = {
    assigned_to: access.profile.id,
    created_by: access.profile.id,
    customer_id: customerId,
    dealership_id: access.dealership.id,
    original_message: "Walk-in sale recorded at the dealership.",
    source_type: "walk_in",
    status: "new",
    vehicle_id: vehicle.id,
  };
  const { data: inquiry, error: inquiryError } = await adminSupabase
    .from("inquiries")
    .insert(inquiryPayload)
    .select("*")
    .single<Inquiry>();

  if (inquiryError || !inquiry) {
    redirectWithMessage(redirectPath, "error", "Unable to create the walk-in inquiry right now.");
  }

  const salePayload: VehicleSaleInsert = {
    asking_price: parsed.data.asking_price ?? vehicle.price,
    created_by: access.profile.id,
    customer_id: customerId,
    dealership_id: access.dealership.id,
    inquiry_id: inquiry.id,
    notes: parsed.data.notes,
    payment_type: parsed.data.payment_type,
    sold_at: new Date(parsed.data.sold_at).toISOString(),
    sold_price: parsed.data.sold_price,
    vehicle_id: vehicle.id,
  };
  const { data: saleRecord, error: saleError } = await adminSupabase
    .from("vehicle_sales")
    .insert(salePayload)
    .select("*")
    .single<VehicleSale>();

  if (saleError || !saleRecord) {
    redirectWithMessage(redirectPath, "error", "Unable to create the sale record right now.");
  }

  const paymentPlanPayload = buildSalePaymentPlanInsert({
    dealershipId: access.dealership.id,
    plan: buildSalePlanInputFromParsed(access, parsed.data),
    saleId: saleRecord.id,
  });
  const { data: paymentPlan, error: paymentPlanError } = await adminSupabase
    .from("sale_payment_plans")
    .insert(paymentPlanPayload)
    .select("*")
    .single<SalePaymentPlan>();

  if (paymentPlanError || !paymentPlan) {
    redirectWithMessage(
      redirectPath,
      "error",
      "The sale was recorded, but the payment plan could not be created.",
    );
  }

  await adminSupabase.from("sale_payment_plan_events").insert({
    created_by: access.profile.id,
    dealership_id: access.dealership.id,
    event_type: "created",
    metadata: {
      payment_type: parsed.data.payment_type,
      plan_tbd: parsed.data.plan_tbd,
      sale_id: saleRecord.id,
      status: paymentPlan.status,
    } satisfies Json,
    plan_id: paymentPlan.id,
  });

  await syncPaymentScheduleForPlan({
    dealershipId: access.dealership.id,
    plan: paymentPlan,
    soldAt: saleRecord.sold_at,
  });

  const { error: vehicleError } = await adminSupabase
    .from("vehicles")
    .update({
      availability: "sold",
      status: "sold",
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicle.id);

  if (vehicleError) {
    redirectWithMessage(
      redirectPath,
      "error",
      "The sale was recorded, but the vehicle status could not be updated.",
    );
  }

  const { error: inquiryUpdateError } = await adminSupabase
    .from("inquiries")
    .update({
      lost_reason: null,
      status: "won",
      vehicle_id: vehicle.id,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiry.id);

  if (inquiryUpdateError) {
    redirectWithMessage(
      redirectPath,
      "error",
      "The sale was recorded, but the inquiry could not be closed as won.",
    );
  }

  await adminSupabase.from("inquiry_events").insert({
    created_by: access.profile.id,
    dealership_id: access.dealership.id,
    event_type: "marked_won",
    inquiry_id: inquiry.id,
    metadata: {
      sale_id: saleRecord.id,
      sold_price: String(saleRecord.sold_price),
      vehicle_id: vehicle.id,
      walk_in_sale: true,
    } satisfies Json,
    new_status: "won",
    note: "Walk-in sale recorded.",
    old_status: inquiry.status,
  });

  revalidateSalesSurfaces({
    dealershipSlug: access.dealership.slug,
    inquiryId: inquiry.id,
    redirectPath: `/admin/sales/${saleRecord.id}`,
    saleId: saleRecord.id,
    vehicleId: vehicle.id,
    vehicleSlug: vehicle.slug,
  });
  revalidatePath("/admin/customers");
  redirect(`/admin/sales/${saleRecord.id}?success=${encodeURIComponent("Walk-in sale recorded.")}`);
}
