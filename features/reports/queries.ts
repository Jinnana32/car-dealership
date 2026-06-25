import "server-only";

import { INQUIRY_SOURCE_TYPES, INQUIRY_STATUSES } from "@/features/inquiries/constants";
import type { Customer } from "@/features/customers/types";
import type { Inquiry } from "@/features/inquiries/types";
import { getInquirySourceLabel } from "@/features/inquiries/utils";
import { getFollowUpBucket } from "@/features/pipeline/utils";
import type {
  InquiryReportResult,
  InventoryReportResult,
  LeadSourceReportResult,
  PipelineReportResult,
  ReportsOverviewData,
  SalesReportResult,
} from "@/features/reports/types";
import type { LeadSourceReportRow, PipelineFollowUpRow, PipelineStatusSummaryRow } from "@/features/reports/types";
import {
  inquiryReportFilterSchema,
  inventoryReportFilterSchema,
  leadSourceReportFilterSchema,
  pipelineReportFilterSchema,
  salesReportFilterSchema,
} from "@/features/reports/validators";
import { mapVehicleSaleRecords } from "@/features/sales/queries";
import type { VehicleSale } from "@/features/sales/types";
import type { AdminAccessContext } from "@/lib/auth/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Vehicle } from "@/features/vehicles/types";

type ReportQueryInput = Record<string, string | string[] | undefined>;

type ProfileSummary = {
  email: string | null;
  full_name: string | null;
  id: string;
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildProfileName(profile: ProfileSummary): string {
  return profile.full_name?.trim() || profile.email || "Team member";
}

function parseStartDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinDateRange(input: {
  from: string;
  to: string;
  value: string;
}): boolean {
  const current = new Date(input.value);

  if (Number.isNaN(current.getTime())) {
    return false;
  }

  const start = parseStartDate(input.from);
  const end = parseEndDate(input.to);

  if (start && current < start) {
    return false;
  }

  if (end && current > end) {
    return false;
  }

  return true;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return total / values.length;
}

function roundToOneDecimal(value: number): number {
  return Number(value.toFixed(1));
}

async function getProfileNameMap(profileIds: string[]): Promise<Map<string, string>> {
  if (profileIds.length === 0) {
    return new Map();
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", profileIds);

  return new Map(
    (data ?? []).map((profile) => [profile.id, buildProfileName(profile)]),
  );
}

export function parseSalesReportFilters(input: ReportQueryInput) {
  return salesReportFilterSchema.parse({
    from: getScalarValue(input.from),
    paymentType: getScalarValue(input.paymentType),
    soldById: getScalarValue(input.soldById),
    to: getScalarValue(input.to),
    vehicleId: getScalarValue(input.vehicleId),
  });
}

export function parseInventoryReportFilters(input: ReportQueryInput) {
  return inventoryReportFilterSchema.parse({
    availability: getScalarValue(input.availability),
    brand: getScalarValue(input.brand),
    maxPrice: getScalarValue(input.maxPrice),
    minPrice: getScalarValue(input.minPrice),
    model: getScalarValue(input.model),
    status: getScalarValue(input.status),
  });
}

export function parseInquiryReportFilters(input: ReportQueryInput) {
  return inquiryReportFilterSchema.parse({
    assignedToId: getScalarValue(input.assignedToId),
    from: getScalarValue(input.from),
    source: getScalarValue(input.source),
    status: getScalarValue(input.status),
    to: getScalarValue(input.to),
    vehicleId: getScalarValue(input.vehicleId),
  });
}

export function parseLeadSourceReportFilters(input: ReportQueryInput) {
  return leadSourceReportFilterSchema.parse({
    from: getScalarValue(input.from),
    to: getScalarValue(input.to),
  });
}

export function parsePipelineReportFilters(input: ReportQueryInput) {
  return pipelineReportFilterSchema.parse({
    assignedToId: getScalarValue(input.assignedToId),
    from: getScalarValue(input.from),
    source: getScalarValue(input.source),
    status: getScalarValue(input.status),
    to: getScalarValue(input.to),
  });
}

export async function getReportsOverview(
  access: AdminAccessContext,
): Promise<ReportsOverviewData> {
  const adminSupabase = createSupabaseAdminClient();
  const [vehiclesResponse, inquiriesResponse, salesResponse] = await Promise.all([
    adminSupabase
      .from("vehicles")
      .select("status, availability")
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("inquiries")
      .select("status, source_type")
      .eq("dealership_id", access.dealership.id),
    adminSupabase
      .from("vehicle_sales")
      .select("sold_price")
      .eq("dealership_id", access.dealership.id),
  ]);

  const vehicles = vehiclesResponse.data ?? [];
  const inquiries = inquiriesResponse.data ?? [];
  const sales = salesResponse.data ?? [];
  const sourceCounts = new Map<string, number>();

  for (const inquiry of inquiries) {
    sourceCounts.set(
      inquiry.source_type,
      (sourceCounts.get(inquiry.source_type) ?? 0) + 1,
    );
  }

  const topLeadSourceEntry = Array.from(sourceCounts.entries()).sort(
    (left, right) => right[1] - left[1],
  )[0];

  return {
    availableVehicles: vehicles.filter((vehicle) => vehicle.availability === "available").length,
    lostInquiries: inquiries.filter((inquiry) => inquiry.status === "lost").length,
    reservedVehicles: vehicles.filter((vehicle) => vehicle.status === "reserved").length,
    soldVehicles: vehicles.filter((vehicle) => vehicle.status === "sold").length,
    topLeadSource: topLeadSourceEntry
      ? getInquirySourceLabel(topLeadSourceEntry[0] as Inquiry["source_type"])
      : null,
    totalInquiries: inquiries.length,
    totalSalesAmount: sales.reduce((sum, sale) => sum + sale.sold_price, 0),
    totalVehicles: vehicles.length,
    wonInquiries: inquiries.filter((inquiry) => inquiry.status === "won").length,
  };
}

export async function getSalesReport(
  access: AdminAccessContext,
  input: ReportQueryInput,
): Promise<SalesReportResult> {
  const filters = parseSalesReportFilters(input);
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
  const filteredSales = ((data ?? []) as VehicleSale[]).filter((sale) =>
    isWithinDateRange({
      from: filters.from,
      to: filters.to,
      value: sale.sold_at,
    }),
  );
  const mappedSales = await mapVehicleSaleRecords(access, filteredSales);
  const rows = mappedSales.map((row) => ({
    askingPrice: row.asking_price,
    createdByName: row.createdByName,
    customer: row.customer,
    id: row.id,
    inquiry: row.inquiry
      ? {
          id: row.inquiry.id,
          sourceType: row.inquiry.source_type,
        }
      : null,
    paymentType: row.payment_type,
    soldAt: row.sold_at,
    soldPrice: row.sold_price,
    vehicle: row.vehicle,
  }));
  const soldPrices = rows.map((row) => row.soldPrice);

  return {
    filters,
    metrics: {
      averageSoldPrice: average(soldPrices),
      highestSoldPrice: soldPrices.length > 0 ? Math.max(...soldPrices) : null,
      lowestSoldPrice: soldPrices.length > 0 ? Math.min(...soldPrices) : null,
      soldCount: rows.length,
      totalSalesAmount: soldPrices.reduce((sum, value) => sum + value, 0),
    },
    rows,
    totalCount: rows.length,
  };
}

export async function getInventoryReport(
  access: AdminAccessContext,
  input: ReportQueryInput,
): Promise<InventoryReportResult> {
  const filters = parseInventoryReportFilters(input);
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("updated_at", { ascending: false });
  const vehicles = ((data ?? []) as Vehicle[]).filter((vehicle) => {
    if (filters.status !== "all" && vehicle.status !== filters.status) {
      return false;
    }

    if (filters.availability !== "all" && vehicle.availability !== filters.availability) {
      return false;
    }

    if (filters.brand && !vehicle.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
      return false;
    }

    if (filters.model && !vehicle.model.toLowerCase().includes(filters.model.toLowerCase())) {
      return false;
    }

    if (filters.minPrice !== null && (vehicle.price ?? 0) < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice !== null && (vehicle.price ?? 0) > filters.maxPrice) {
      return false;
    }

    return true;
  });
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  const { data: inquiries } =
    vehicleIds.length > 0
      ? await adminSupabase
          .from("inquiries")
          .select("vehicle_id")
          .eq("dealership_id", access.dealership.id)
          .in("vehicle_id", vehicleIds)
      : { data: [] as Array<Pick<Inquiry, "vehicle_id">> };
  const inquiryCounts = new Map<string, number>();

  for (const inquiry of inquiries ?? []) {
    if (!inquiry.vehicle_id) {
      continue;
    }

    inquiryCounts.set(
      inquiry.vehicle_id,
      (inquiryCounts.get(inquiry.vehicle_id) ?? 0) + 1,
    );
  }

  const prices = vehicles
    .map((vehicle) => vehicle.price)
    .filter((value): value is number => value !== null);

  return {
    filters,
    metrics: {
      archivedVehicles: vehicles.filter((vehicle) => vehicle.status === "archived").length,
      averagePrice: average(prices),
      availableVehicles: vehicles.filter((vehicle) => vehicle.availability === "available").length,
      draftVehicles: vehicles.filter((vehicle) => vehicle.status === "draft").length,
      reservedVehicles: vehicles.filter((vehicle) => vehicle.status === "reserved").length,
      soldVehicles: vehicles.filter((vehicle) => vehicle.status === "sold").length,
      totalListedValue: vehicles
        .filter((vehicle) => vehicle.availability === "available")
        .reduce((sum, vehicle) => sum + (vehicle.price ?? 0), 0),
      totalVehicles: vehicles.length,
    },
    rows: vehicles.map((vehicle) => ({
      ...vehicle,
      inquiriesCount: inquiryCounts.get(vehicle.id) ?? 0,
    })),
    totalCount: vehicles.length,
  };
}

export async function getInquiryReport(
  access: AdminAccessContext,
  input: ReportQueryInput,
): Promise<InquiryReportResult> {
  const filters = parseInquiryReportFilters(input);
  const adminSupabase = createSupabaseAdminClient();
  let query = adminSupabase
    .from("inquiries")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.source !== "all") {
    query = query.eq("source_type", filters.source);
  }

  if (filters.vehicleId) {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  if (filters.assignedToId) {
    query = query.eq("assigned_to", filters.assignedToId);
  }

  const { data } = await query;
  const inquiries = ((data ?? []) as Inquiry[]).filter((inquiry) =>
    isWithinDateRange({
      from: filters.from,
      to: filters.to,
      value: inquiry.created_at,
    }),
  );
  const customerIds = Array.from(new Set(inquiries.map((inquiry) => inquiry.customer_id)));
  const vehicleIds = Array.from(
    new Set(
      inquiries
        .map((inquiry) => inquiry.vehicle_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const profileIds = Array.from(
    new Set(
      inquiries
        .map((inquiry) => inquiry.assigned_to)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const [customersResponse, vehiclesResponse, profileNames] = await Promise.all([
    customerIds.length > 0
      ? adminSupabase
          .from("customers")
          .select("id, full_name")
          .eq("dealership_id", access.dealership.id)
          .in("id", customerIds)
      : Promise.resolve({
          data: [] as Array<Pick<Customer, "full_name" | "id">>,
        }),
    vehicleIds.length > 0
      ? adminSupabase
          .from("vehicles")
          .select("id, title")
          .eq("dealership_id", access.dealership.id)
          .in("id", vehicleIds)
      : Promise.resolve({
          data: [] as Array<Pick<Vehicle, "id" | "title">>,
        }),
    getProfileNameMap(profileIds),
  ]);
  const customersById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer]),
  );
  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );
  const rows = inquiries.map((inquiry) => ({
    assignedToName: inquiry.assigned_to
      ? profileNames.get(inquiry.assigned_to) ?? null
      : null,
    budgetRange: inquiry.budget_range,
    createdAt: inquiry.created_at,
    customer: customersById.get(inquiry.customer_id) ?? null,
    followUpAt: inquiry.next_follow_up_at,
    id: inquiry.id,
    paymentPreference: inquiry.payment_preference,
    sourceType: inquiry.source_type,
    status: inquiry.status,
    vehicle: inquiry.vehicle_id ? vehiclesById.get(inquiry.vehicle_id) ?? null : null,
  }));

  return {
    filters,
    metrics: {
      contacted: rows.filter((row) => row.status === "contacted").length,
      conversionRate: rows.length > 0
        ? roundToOneDecimal((rows.filter((row) => row.status === "won").length / rows.length) * 100)
        : 0,
      lost: rows.filter((row) => row.status === "lost").length,
      negotiation: rows.filter((row) => row.status === "negotiation").length,
      new: rows.filter((row) => row.status === "new").length,
      reserved: rows.filter((row) => row.status === "reserved").length,
      totalInquiries: rows.length,
      viewingScheduled: rows.filter((row) => row.status === "viewing_scheduled").length,
      won: rows.filter((row) => row.status === "won").length,
    },
    rows,
    totalCount: rows.length,
  };
}

export async function getLeadSourceReport(
  access: AdminAccessContext,
  input: ReportQueryInput,
): Promise<LeadSourceReportResult> {
  const filters = parseLeadSourceReportFilters(input);
  const adminSupabase = createSupabaseAdminClient();
  const { data: inquiryData } = await adminSupabase
    .from("inquiries")
    .select("id, source_type, status, created_at")
    .eq("dealership_id", access.dealership.id);
  const inquiries = ((inquiryData ?? []) as Array<
    Pick<Inquiry, "created_at" | "id" | "source_type" | "status">
  >).filter((inquiry) =>
    isWithinDateRange({
      from: filters.from,
      to: filters.to,
      value: inquiry.created_at,
    }),
  );
  const inquiryIds = inquiries.map((inquiry) => inquiry.id);
  const { data: saleData } =
    inquiryIds.length > 0
      ? await adminSupabase
          .from("vehicle_sales")
          .select("inquiry_id, sold_price")
          .eq("dealership_id", access.dealership.id)
          .in("inquiry_id", inquiryIds)
      : { data: [] as Array<Pick<VehicleSale, "inquiry_id" | "sold_price">> };
  const salesAmountByInquiryId = new Map(
    (saleData ?? [])
      .filter((sale): sale is Pick<VehicleSale, "inquiry_id" | "sold_price"> & { inquiry_id: string } => Boolean(sale.inquiry_id))
      .map((sale) => [sale.inquiry_id, sale.sold_price]),
  );

  const rows: LeadSourceReportRow[] = INQUIRY_SOURCE_TYPES.map((sourceType) => {
    const sourceInquiries = inquiries.filter((inquiry) => inquiry.source_type === sourceType);
    const wonCount = sourceInquiries.filter((inquiry) => inquiry.status === "won").length;
    const lostCount = sourceInquiries.filter((inquiry) => inquiry.status === "lost").length;
    const activeCount = sourceInquiries.filter(
      (inquiry) => inquiry.status !== "won" && inquiry.status !== "lost",
    ).length;
    const salesAmount = sourceInquiries.reduce(
      (sum, inquiry) => sum + (salesAmountByInquiryId.get(inquiry.id) ?? 0),
      0,
    );

    return {
      activeCount,
      conversionRate: sourceInquiries.length > 0
        ? roundToOneDecimal((wonCount / sourceInquiries.length) * 100)
        : 0,
      lostCount,
      salesAmount,
      sourceType,
      totalInquiries: sourceInquiries.length,
      wonCount,
    };
  });
  const topSource = rows
    .filter((row) => row.totalInquiries > 0)
    .sort((left, right) => right.totalInquiries - left.totalInquiries)[0];

  return {
    filters,
    metrics: {
      processedLeadCount: rows.reduce((sum, row) => sum + row.totalInquiries, 0),
      topSource: topSource ? getInquirySourceLabel(topSource.sourceType) : null,
      totalSalesAmount: rows.reduce((sum, row) => sum + row.salesAmount, 0),
      totalWonLeads: rows.reduce((sum, row) => sum + row.wonCount, 0),
    },
    rows,
  };
}

export async function getPipelineReport(
  access: AdminAccessContext,
  input: ReportQueryInput,
): Promise<PipelineReportResult> {
  const filters = parsePipelineReportFilters(input);
  const adminSupabase = createSupabaseAdminClient();
  let query = adminSupabase
    .from("inquiries")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.source !== "all") {
    query = query.eq("source_type", filters.source);
  }

  if (filters.assignedToId) {
    query = query.eq("assigned_to", filters.assignedToId);
  }

  const { data } = await query;
  const inquiries = ((data ?? []) as Inquiry[]).filter((inquiry) =>
    isWithinDateRange({
      from: filters.from,
      to: filters.to,
      value: inquiry.created_at,
    }),
  );
  const customerIds = Array.from(new Set(inquiries.map((inquiry) => inquiry.customer_id)));
  const vehicleIds = Array.from(
    new Set(
      inquiries
        .map((inquiry) => inquiry.vehicle_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const profileIds = Array.from(
    new Set(
      inquiries
        .map((inquiry) => inquiry.assigned_to)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const [customersResponse, vehiclesResponse, profileNames] = await Promise.all([
    customerIds.length > 0
      ? adminSupabase
          .from("customers")
          .select("id, full_name")
          .eq("dealership_id", access.dealership.id)
          .in("id", customerIds)
      : Promise.resolve({
          data: [] as Array<Pick<Customer, "full_name" | "id">>,
        }),
    vehicleIds.length > 0
      ? adminSupabase
          .from("vehicles")
          .select("id, title")
          .eq("dealership_id", access.dealership.id)
          .in("id", vehicleIds)
      : Promise.resolve({
          data: [] as Array<Pick<Vehicle, "id" | "title">>,
        }),
    getProfileNameMap(profileIds),
  ]);
  const customersById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer.full_name]),
  );
  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle.title]),
  );
  const rows: PipelineStatusSummaryRow[] = INQUIRY_STATUSES.map((status) => {
    const statusInquiries = inquiries.filter((inquiry) => inquiry.status === status);
    const sortedDates = statusInquiries
      .map((inquiry) => inquiry.created_at)
      .sort((left, right) => new Date(left).getTime() - new Date(right).getTime());

    return {
      count: statusInquiries.length,
      newestInquiryDate: sortedDates[sortedDates.length - 1] ?? null,
      oldestInquiryDate: sortedDates[0] ?? null,
      status,
    };
  });
  const followUps: PipelineFollowUpRow[] = inquiries.map((inquiry) => ({
    assignedToName: inquiry.assigned_to
      ? profileNames.get(inquiry.assigned_to) ?? null
      : null,
    bucket: getFollowUpBucket(inquiry.next_follow_up_at),
    customerName: customersById.get(inquiry.customer_id) ?? "Customer unavailable",
    followUpAt: inquiry.next_follow_up_at,
    id: inquiry.id,
    sourceType: inquiry.source_type,
    status: inquiry.status,
    vehicleTitle: inquiry.vehicle_id ? vehiclesById.get(inquiry.vehicle_id) ?? null : null,
  }));
  const pipelineAges = inquiries.map((inquiry) => {
    const createdAt = new Date(inquiry.created_at).getTime();

    return (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  });

  return {
    filters,
    followUps,
    metrics: {
      averageDaysInPipeline: roundToOneDecimal(average(pipelineAges)),
      dueTodayCount: followUps.filter((row) => row.bucket === "today").length,
      lostCount: inquiries.filter((inquiry) => inquiry.status === "lost").length,
      overdueCount: followUps.filter((row) => row.bucket === "overdue").length,
      totalInquiries: inquiries.length,
      wonCount: inquiries.filter((inquiry) => inquiry.status === "won").length,
    },
    rows,
  };
}
