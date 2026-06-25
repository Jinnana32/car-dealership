import {
  SALE_PAYMENT_METHOD_LABELS,
  SALE_PAYMENT_PLAN_STATUS_LABELS,
  SALE_PAYMENT_PLAN_TYPE_LABELS,
  VEHICLE_SALE_PAYMENT_TYPE_LABELS,
} from "@/features/sales/constants";
import type {
  SalePaymentMethod,
  SalePaymentPlanStatus,
  SalePaymentPlanType,
  SalePaymentsReportRow,
  SalesListFilters,
  SalesListSummary,
  VehicleSalePaymentType,
  VehicleSaleRecord,
} from "@/features/sales/types";
import { buildCsvContent } from "@/features/reports/utils";

export function getVehicleSalePaymentTypeLabel(
  value: VehicleSalePaymentType,
): string {
  if (!value) {
    return "Not set";
  }

  return VEHICLE_SALE_PAYMENT_TYPE_LABELS[value];
}

export function getSalePaymentPlanTypeLabel(value: SalePaymentPlanType): string {
  return SALE_PAYMENT_PLAN_TYPE_LABELS[value];
}

export function getSalePaymentPlanStatusLabel(value: SalePaymentPlanStatus): string {
  return SALE_PAYMENT_PLAN_STATUS_LABELS[value];
}

export function getSalePaymentMethodLabel(value: SalePaymentMethod): string {
  return SALE_PAYMENT_METHOD_LABELS[value];
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

export function isWithinSalesDateRange(input: {
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

export function buildSalesHref(filters: SalesListFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.from) {
    searchParams.set("from", filters.from);
  }

  if (filters.to) {
    searchParams.set("to", filters.to);
  }

  if (filters.paymentType !== "all") {
    searchParams.set("paymentType", filters.paymentType);
  }

  if (filters.search) {
    searchParams.set("search", filters.search);
  }

  if (filters.soldById) {
    searchParams.set("soldById", filters.soldById);
  }

  if (filters.vehicleId) {
    searchParams.set("vehicleId", filters.vehicleId);
  }

  const query = searchParams.toString();

  return query ? `/admin/sales?${query}` : "/admin/sales";
}

export function countActiveSalesFilters(filters: SalesListFilters): number {
  let count = 0;

  if (filters.from) {
    count += 1;
  }

  if (filters.to) {
    count += 1;
  }

  if (filters.paymentType !== "all") {
    count += 1;
  }

  if (filters.search) {
    count += 1;
  }

  if (filters.soldById) {
    count += 1;
  }

  if (filters.vehicleId) {
    count += 1;
  }

  return count;
}

export function matchesSalesSearch(
  sale: VehicleSaleRecord,
  search: string,
): boolean {
  const normalized = search.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const customerName = sale.customer?.full_name?.toLowerCase() ?? "";
  const vehicleTitle = sale.vehicle?.title?.toLowerCase() ?? "";

  return customerName.includes(normalized) || vehicleTitle.includes(normalized);
}

export function buildSalePaymentsCsv(rows: SalePaymentsReportRow[]): string {
  return buildCsvContent(
    [
      "Paid At",
      "Vehicle",
      "Customer",
      "Amount",
      "Method",
      "Reference",
      "Status",
      "Recorded By",
      "Sale ID",
      "Notes",
    ],
    rows.map((row) => [
      row.paidAt,
      row.vehicleTitle,
      row.customerName,
      row.amount,
      row.paymentMethod,
      row.referenceNumber,
      row.status,
      row.recordedByName,
      row.saleId,
      row.notes,
    ]),
  );
}

export function buildSalesListSummary(sales: VehicleSaleRecord[]): SalesListSummary {
  const soldPrices = sales.map((sale) => sale.sold_price);
  const totalSalesAmount = soldPrices.reduce((sum, value) => sum + value, 0);
  const cashCount = sales.filter((sale) => sale.payment_type === "cash").length;
  const financingCount = sales.filter(
    (sale) => sale.payment_type === "financing" || sale.payment_type === "trade_in",
  ).length;

  return {
    averageSoldPrice:
      soldPrices.length > 0 ? totalSalesAmount / soldPrices.length : 0,
    cashCount,
    financingCount,
    soldCount: sales.length,
    totalSalesAmount,
  };
}
