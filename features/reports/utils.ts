import { getInquirySourceLabel, getInquiryStatusLabel } from "@/features/inquiries/utils";
import type {
  InquiryReportRow,
  InventoryReportRow,
  LeadSourceReportRow,
  PipelineFollowUpRow,
  PipelineStatusSummaryRow,
  SalesReportRow,
} from "@/features/reports/types";
import { getVehicleSalePaymentTypeLabel } from "@/features/sales/utils";
import {
  formatVehicleCurrency,
  formatVehicleDateTime,
  formatVehicleMileage,
  getVehicleAvailabilityLabel,
  getVehicleStatusLabel,
} from "@/features/vehicles/utils";
import { formatCrmDate, formatCrmDateTime, getPaymentPreferenceLabel } from "@/features/inquiries/utils";
import { getFollowUpBucketLabel } from "@/features/pipeline/utils";

export function buildReportQueryString(
  filters: Record<string, string | number | null | undefined>,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function buildCsvContent(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");
}

export function buildCsvResponse(
  filename: string,
  content: string,
): Response {
  return new Response(content, {
    headers: {
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function buildSalesCsv(rows: SalesReportRow[]): string {
  return buildCsvContent(
    [
      "Sold Date",
      "Vehicle",
      "Customer",
      "Inquiry Source",
      "Asking Price",
      "Sold Price",
      "Payment Type",
      "Sold By",
    ],
    rows.map((row) => [
      formatVehicleDateTime(row.soldAt),
      row.vehicle?.title ?? "Not linked",
      row.customer?.full_name ?? "Not linked",
      row.inquiry?.sourceType ? getInquirySourceLabel(row.inquiry.sourceType) : "Not linked",
      formatVehicleCurrency(row.askingPrice),
      formatVehicleCurrency(row.soldPrice),
      getVehicleSalePaymentTypeLabel(row.paymentType),
      row.createdByName ?? "Team member",
    ]),
  );
}

export function buildInventoryCsv(rows: InventoryReportRow[]): string {
  return buildCsvContent(
    [
      "Vehicle",
      "Brand",
      "Model",
      "Year",
      "Price",
      "Mileage",
      "Status",
      "Availability",
      "Inquiries",
      "Created",
      "Updated",
    ],
    rows.map((row) => [
      row.title,
      row.brand,
      row.model,
      row.year ?? "",
      formatVehicleCurrency(row.price),
      formatVehicleMileage(row.mileage),
      getVehicleStatusLabel(row.status),
      getVehicleAvailabilityLabel(row.availability),
      row.inquiriesCount,
      formatVehicleDateTime(row.created_at),
      formatVehicleDateTime(row.updated_at),
    ]),
  );
}

export function buildInquiriesCsv(rows: InquiryReportRow[]): string {
  return buildCsvContent(
    [
      "Created Date",
      "Customer",
      "Vehicle",
      "Source",
      "Status",
      "Assigned To",
      "Budget Range",
      "Payment Preference",
      "Next Follow-up",
    ],
    rows.map((row) => [
      formatCrmDateTime(row.createdAt),
      row.customer?.full_name ?? "Not linked",
      row.vehicle?.title ?? "Not linked",
      getInquirySourceLabel(row.sourceType),
      getInquiryStatusLabel(row.status),
      row.assignedToName ?? "Unassigned",
      row.budgetRange ?? "Not set",
      getPaymentPreferenceLabel(row.paymentPreference),
      formatCrmDate(row.followUpAt),
    ]),
  );
}

export function buildLeadSourcesCsv(rows: LeadSourceReportRow[]): string {
  return buildCsvContent(
    [
      "Source",
      "Total Inquiries",
      "Won",
      "Lost",
      "Active",
      "Conversion Rate",
      "Sales Amount",
    ],
    rows.map((row) => [
      getInquirySourceLabel(row.sourceType),
      row.totalInquiries,
      row.wonCount,
      row.lostCount,
      row.activeCount,
      `${row.conversionRate.toFixed(1)}%`,
      formatVehicleCurrency(row.salesAmount),
    ]),
  );
}

export function buildPipelineCsv(
  statusRows: PipelineStatusSummaryRow[],
  followUps: PipelineFollowUpRow[],
): string {
  const statusSection = buildCsvContent(
    ["Status", "Count", "Oldest Inquiry Date", "Newest Inquiry Date"],
    statusRows.map((row) => [
      getInquiryStatusLabel(row.status),
      row.count,
      formatCrmDate(row.oldestInquiryDate),
      formatCrmDate(row.newestInquiryDate),
    ]),
  );
  const followUpSection = buildCsvContent(
    ["Customer", "Vehicle", "Status", "Source", "Follow-up Bucket", "Follow-up Date", "Assigned To"],
    followUps.map((row) => [
      row.customerName,
      row.vehicleTitle ?? "Not linked",
      getInquiryStatusLabel(row.status),
      getInquirySourceLabel(row.sourceType),
      getFollowUpBucketLabel(row.bucket),
      formatCrmDate(row.followUpAt),
      row.assignedToName ?? "Unassigned",
    ]),
  );

  return `${statusSection}\n\n${followUpSection}`;
}
