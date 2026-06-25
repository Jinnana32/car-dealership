import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminAccessContext } from "@/lib/auth/types";
import { canManageDealership } from "@/lib/auth/permissions";
import type { Customer } from "@/features/customers/types";
import type { Inquiry } from "@/features/inquiries/types";
import type { Vehicle } from "@/features/vehicles/types";
import { calculateLedgerSummary } from "@/features/sales/payment-ledger";
import { reconcileSalePaymentPlan } from "@/features/sales/payment-ledger-server";
import type {
  SaleCustomerOption,
  SaleInquiryOption,
  SaleLedgerContext,
  SaleLookupResult,
  SalePayment,
  SalePaymentPlan,
  SalePaymentRecord,
  SalePaymentScheduleItem,
  SalePaymentsReportResult,
  SalePaymentsReportRow,
  SalesCollectionsSummary,
  SalesListResult,
  VehicleSale,
  VehicleSaleRecord,
  VehicleSalesContext,
} from "@/features/sales/types";
import { salesListFilterSchema } from "@/features/sales/validators";
import {
  buildSalesListSummary,
  isWithinSalesDateRange,
  matchesSalesSearch,
} from "@/features/sales/utils";

type ReportQueryInput = Record<string, string | string[] | undefined>;

type ProfileSummary = {
  email: string | null;
  full_name: string | null;
  id: string;
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function getPaymentPlanBySaleId(
  access: AdminAccessContext,
  saleId: string,
): Promise<SalePaymentPlan | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("sale_payment_plans")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("sale_id", saleId)
    .maybeSingle<SalePaymentPlan>();

  return data ?? null;
}

export function canAccessSaleRecord(
  access: AdminAccessContext,
  sale: VehicleSaleRecord,
): boolean {
  if (canManageDealership(access.membership.role)) {
    return true;
  }

  if (sale.created_by === access.profile.id) {
    return true;
  }

  if (sale.inquiry?.assigned_to === access.profile.id) {
    return true;
  }

  return false;
}

async function mapSalePaymentRecords(
  access: AdminAccessContext,
  payments: SalePayment[],
): Promise<SalePaymentRecord[]> {
  if (payments.length === 0) {
    return [];
  }

  const adminSupabase = createSupabaseAdminClient();
  const profileIds = Array.from(
    new Set(
      payments
        .map((payment) => payment.recorded_by)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const { data: profiles } =
    profileIds.length > 0
      ? await adminSupabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", profileIds)
      : { data: [] as ProfileSummary[] };

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, buildProfileName(profile)]),
  );

  return payments.map((payment) => ({
    ...payment,
    recordedByName: payment.recorded_by
      ? profilesById.get(payment.recorded_by) ?? null
      : null,
  }));
}

async function getSalePaymentsBySaleId(
  access: AdminAccessContext,
  saleId: string,
): Promise<SalePaymentRecord[]> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("sale_payments")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("sale_id", saleId)
    .order("paid_at", { ascending: false });

  return mapSalePaymentRecords(access, (data ?? []) as SalePayment[]);
}

async function getSaleScheduleItemsByPlanId(
  access: AdminAccessContext,
  planId: string,
): Promise<SalePaymentScheduleItem[]> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("sale_payment_schedule_items")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("plan_id", planId)
    .order("due_at", { ascending: true });

  return (data ?? []) as SalePaymentScheduleItem[];
}

async function buildSaleLedgerContext(input: {
  access: AdminAccessContext;
  paymentPlan: SalePaymentPlan | null;
  record: VehicleSaleRecord;
}): Promise<SaleLedgerContext> {
  const payments = await getSalePaymentsBySaleId(input.access, input.record.id);
  const scheduleItems = input.paymentPlan
    ? await getSaleScheduleItemsByPlanId(input.access, input.paymentPlan.id)
    : [];
  const summary = input.paymentPlan
    ? calculateLedgerSummary({
        plan: input.paymentPlan,
        postedPayments: payments.filter((payment) => payment.status === "posted"),
        scheduleItems,
      })
    : {
        balanceRemaining: 0,
        collectedAtClosing: 0,
        hasOverdueSchedule: false,
        ledgerPaid: 0,
        paidToDate: 0,
      };
  const canRecordPayment =
    Boolean(input.paymentPlan) &&
    summary.balanceRemaining > 0 &&
    canAccessSaleRecord(input.access, input.record);
  const canVoidPayments = canManageDealership(input.access.membership.role);

  return {
    canRecordPayment,
    canVoidPayments,
    payments,
    scheduleItems,
    summary,
  };
}

export async function getSalesCollectionsSummary(
  access: AdminAccessContext,
): Promise<SalesCollectionsSummary> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: plans } = await adminSupabase
    .from("sale_payment_plans")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .gt("balance_remaining", 0);

  if (!plans || plans.length === 0) {
    return {
      openBalanceTotal: 0,
      overdueCount: 0,
    };
  }

  const saleIds = plans.map((plan) => plan.sale_id);
  const { data: sales } = await adminSupabase
    .from("vehicle_sales")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .in("id", saleIds);
  const mappedSales = await mapVehicleSaleRecords(
    access,
    (sales ?? []) as VehicleSale[],
  );
  const accessibleSaleIds = new Set(
    mappedSales
      .filter((sale) => canAccessSaleRecord(access, sale))
      .map((sale) => sale.id),
  );
  const accessiblePlans = (plans as SalePaymentPlan[]).filter((plan) =>
    accessibleSaleIds.has(plan.sale_id),
  );

  return {
    openBalanceTotal: accessiblePlans.reduce(
      (sum, plan) => sum + plan.balance_remaining,
      0,
    ),
    overdueCount: accessiblePlans.filter((plan) => plan.status === "overdue").length,
  };
}

export async function getSalePaymentsReport(
  access: AdminAccessContext,
  input: ReportQueryInput,
): Promise<SalePaymentsReportResult> {
  const adminSupabase = createSupabaseAdminClient();
  const from = getScalarValue(input.from) ?? "";
  const to = getScalarValue(input.to) ?? "";
  const { data: payments } = await adminSupabase
    .from("sale_payments")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("paid_at", { ascending: false });
  const filteredPayments = ((payments ?? []) as SalePayment[]).filter((payment) =>
    isWithinSalesDateRange({
      from,
      to,
      value: payment.paid_at,
    }),
  );
  const mappedPayments = await mapSalePaymentRecords(access, filteredPayments);
  const saleIds = Array.from(new Set(mappedPayments.map((payment) => payment.sale_id)));
  const { data: sales } =
    saleIds.length > 0
      ? await adminSupabase
          .from("vehicle_sales")
          .select("*")
          .eq("dealership_id", access.dealership.id)
          .in("id", saleIds)
      : { data: [] as VehicleSale[] };
  const mappedSales = await mapVehicleSaleRecords(access, (sales ?? []) as VehicleSale[]);
  const salesById = new Map(mappedSales.map((sale) => [sale.id, sale]));
  const rows: SalePaymentsReportRow[] = mappedPayments
    .filter((payment) => {
      const sale = salesById.get(payment.sale_id);

      return sale ? canAccessSaleRecord(access, sale) : false;
    })
    .map((payment) => {
      const sale = salesById.get(payment.sale_id);

      return {
        amount: payment.amount,
        customerName: sale?.customer?.full_name ?? null,
        id: payment.id,
        notes: payment.notes,
        paidAt: payment.paid_at,
        paymentMethod: payment.payment_method,
        recordedByName: payment.recordedByName,
        referenceNumber: payment.reference_number,
        saleId: payment.sale_id,
        status: payment.status,
        vehicleTitle: sale?.vehicle?.title ?? null,
      };
    });

  return {
    rows,
    totalCount: rows.length,
  };
}

export async function getAvailableVehicleSaleOptions(
  access: AdminAccessContext,
): Promise<Array<{ id: string; label: string; price: number | null }>> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("vehicles")
    .select("id, title, brand, model, year, price, status, availability")
    .eq("dealership_id", access.dealership.id)
    .neq("status", "archived")
    .neq("status", "sold")
    .order("updated_at", { ascending: false });

  return (data ?? [])
    .filter((vehicle) => vehicle.availability !== "sold")
    .map((vehicle) => ({
      id: vehicle.id,
      label: vehicle.title || [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" "),
      price: vehicle.price,
    }));
}

function buildProfileName(profile: ProfileSummary): string {
  return profile.full_name?.trim() || profile.email || "Team member";
}

export async function mapVehicleSaleRecords(
  access: AdminAccessContext,
  sales: VehicleSale[],
): Promise<VehicleSaleRecord[]> {
  if (sales.length === 0) {
    return [];
  }

  const adminSupabase = createSupabaseAdminClient();
  const customerIds = Array.from(
    new Set(
      sales
        .map((sale) => sale.customer_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const inquiryIds = Array.from(
    new Set(
      sales
        .map((sale) => sale.inquiry_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const profileIds = Array.from(
    new Set(
      sales
        .map((sale) => sale.created_by)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const vehicleIds = Array.from(new Set(sales.map((sale) => sale.vehicle_id)));

  const [customersResponse, inquiriesResponse, profilesResponse, vehiclesResponse] =
    await Promise.all([
      customerIds.length > 0
        ? adminSupabase
            .from("customers")
            .select("id, full_name")
            .eq("dealership_id", access.dealership.id)
            .in("id", customerIds)
        : Promise.resolve({
            data: [] as Array<Pick<Customer, "full_name" | "id">>,
          }),
      inquiryIds.length > 0
        ? adminSupabase
            .from("inquiries")
            .select("id, assigned_to, source_type, status")
            .eq("dealership_id", access.dealership.id)
            .in("id", inquiryIds)
        : Promise.resolve({
            data: [] as Array<
              Pick<Inquiry, "assigned_to" | "id" | "source_type" | "status">
            >,
          }),
      profileIds.length > 0
        ? adminSupabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", profileIds)
        : Promise.resolve({
            data: [] as ProfileSummary[],
          }),
      vehicleIds.length > 0
        ? adminSupabase
            .from("vehicles")
            .select("id, slug, title")
            .eq("dealership_id", access.dealership.id)
            .in("id", vehicleIds)
        : Promise.resolve({
            data: [] as Array<Pick<Vehicle, "id" | "slug" | "title">>,
          }),
    ]);

  const customersById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer]),
  );
  const inquiriesById = new Map(
    (inquiriesResponse.data ?? []).map((inquiry) => [inquiry.id, inquiry]),
  );
  const profilesById = new Map(
    (profilesResponse.data ?? []).map((profile) => [
      profile.id,
      buildProfileName(profile),
    ]),
  );
  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );

  return sales.map((sale) => ({
    ...sale,
    createdByName: sale.created_by
      ? profilesById.get(sale.created_by) ?? null
      : null,
    customer: sale.customer_id ? customersById.get(sale.customer_id) ?? null : null,
    inquiry: sale.inquiry_id ? inquiriesById.get(sale.inquiry_id) ?? null : null,
    vehicle: vehiclesById.get(sale.vehicle_id) ?? null,
  }));
}

export async function getVehicleSaleRecordByInquiryId(
  access: AdminAccessContext,
  inquiryId: string,
): Promise<VehicleSaleRecord | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("vehicle_sales")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("inquiry_id", inquiryId)
    .maybeSingle<VehicleSale>();

  if (!data) {
    return null;
  }

  const [record] = await mapVehicleSaleRecords(access, [data]);

  return record ?? null;
}

export async function getVehicleSalesContext(
  access: AdminAccessContext,
  vehicleId: string,
): Promise<VehicleSalesContext> {
  const adminSupabase = createSupabaseAdminClient();
  const [salesResponse, inquiriesResponse, customersResponse] = await Promise.all([
    adminSupabase
      .from("vehicle_sales")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("vehicle_id", vehicleId)
      .maybeSingle<VehicleSale>(),
    adminSupabase
      .from("inquiries")
      .select("id, customer_id, assigned_to, vehicle_id, status, source_type")
      .eq("dealership_id", access.dealership.id)
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("customers")
      .select("id, full_name")
      .eq("dealership_id", access.dealership.id)
      .order("full_name", { ascending: true }),
  ]);

  const relatedCustomerIds = Array.from(
    new Set((inquiriesResponse.data ?? []).map((inquiry) => inquiry.customer_id)),
  );
  const relatedCustomersById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer.full_name]),
  );
  const saleRecord = salesResponse.data
    ? (await mapVehicleSaleRecords(access, [salesResponse.data]))[0] ?? null
    : null;
  const paymentPlan = saleRecord
    ? await getPaymentPlanBySaleId(access, saleRecord.id)
    : null;
  const relatedInquiries: SaleInquiryOption[] = (inquiriesResponse.data ?? []).map((inquiry) => ({
    ...inquiry,
    customerName:
      relatedCustomersById.get(inquiry.customer_id) ?? "Customer unavailable",
    sourceType: inquiry.source_type,
    vehicleTitle: null,
  }));
  const customerOptions: SaleCustomerOption[] = (customersResponse.data ?? []).map((customer) => ({
    full_name: customer.full_name,
    id: customer.id,
  }));

  void relatedCustomerIds;

  return {
    customerOptions,
    paymentPlan,
    relatedInquiries,
    sale: saleRecord,
  };
}

export function parseSalesListFilters(input: ReportQueryInput) {
  return salesListFilterSchema.parse({
    from: getScalarValue(input.from),
    paymentType: getScalarValue(input.paymentType),
    search: getScalarValue(input.search),
    soldById: getScalarValue(input.soldById),
    to: getScalarValue(input.to),
    vehicleId: getScalarValue(input.vehicleId),
  });
}

export async function getSalesList(
  access: AdminAccessContext,
  input: ReportQueryInput,
): Promise<SalesListResult> {
  const filters = parseSalesListFilters(input);
  const adminSupabase = createSupabaseAdminClient();
  let query = adminSupabase
    .from("vehicle_sales")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("sold_at", { ascending: false });

  if (filters.vehicleId) {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  if (filters.soldById) {
    query = query.eq("created_by", filters.soldById);
  }

  if (filters.paymentType !== "all") {
    query = query.eq("payment_type", filters.paymentType);
  }

  const { data } = await query;
  const dateFilteredSales = ((data ?? []) as VehicleSale[]).filter((sale) =>
    isWithinSalesDateRange({
      from: filters.from,
      to: filters.to,
      value: sale.sold_at,
    }),
  );
  const mappedSales = await mapVehicleSaleRecords(access, dateFilteredSales);
  const accessibleSales = mappedSales.filter((sale) => canAccessSaleRecord(access, sale));
  const sales = accessibleSales.filter((sale) =>
    matchesSalesSearch(sale, filters.search),
  );

  return {
    filters,
    sales,
    summary: buildSalesListSummary(sales),
    totalCount: sales.length,
  };
}

export async function getSaleById(
  access: AdminAccessContext,
  saleId: string,
): Promise<SaleLookupResult> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("vehicle_sales")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", saleId)
    .maybeSingle<VehicleSale>();

  if (!data) {
    return { type: "not_found" };
  }

  const [record] = await mapVehicleSaleRecords(access, [data]);

  if (!record) {
    return { type: "not_found" };
  }

  if (!canAccessSaleRecord(access, record)) {
    return { type: "forbidden" };
  }

  const paymentPlan = await getPaymentPlanBySaleId(access, record.id);
  let reconciledPlan = paymentPlan;

  if (paymentPlan) {
    const payments = await getSalePaymentsBySaleId(access, record.id);
    const scheduleItems = await getSaleScheduleItemsByPlanId(access, paymentPlan.id);

    reconciledPlan = await reconcileSalePaymentPlan({
      dealershipId: access.dealership.id,
      payments,
      plan: paymentPlan,
      scheduleItems,
    });
  }

  const ledger = await buildSaleLedgerContext({
    access,
    paymentPlan: reconciledPlan,
    record,
  });

  return {
    ledger,
    paymentPlan: reconciledPlan,
    record,
    type: "ok",
  };
}
