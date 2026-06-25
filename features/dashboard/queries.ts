import "server-only";

import type { DashboardData, DashboardChartSegment, DashboardMonthlySalesPoint } from "@/features/dashboard/types";
import { getInquirySourceLabel, getInquiryStatusLabel } from "@/features/inquiries/utils";
import { PIPELINE_STAGE_SEQUENCE } from "@/features/pipeline/constants";
import { getSalesCollectionsSummary } from "@/features/sales/queries";
import type { InquirySourceType, InquiryStatus } from "@/features/inquiries/types";
import { canViewSales } from "@/lib/auth/permissions";
import type { AdminAccessContext } from "@/lib/auth/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAKE_CHART_COLORS = [
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
  "#71717a",
];

const PIPELINE_STATUS_COLORS: Record<InquiryStatus, string> = {
  contacted: "#0284c7",
  lost: "#71717a",
  negotiation: "#d97706",
  new: "#dc2626",
  reserved: "#7c3aed",
  viewing_scheduled: "#0891b2",
  won: "#16a34a",
};

function getLastSixMonthBuckets(): Array<{ label: string; monthKey: string }> {
  const buckets: Array<{ label: string; monthKey: string }> = [];
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    buckets.push({
      label: date.toLocaleDateString("en-US", { month: "short" }),
      monthKey,
    });
  }

  return buckets;
}

function isInCurrentMonth(value: string): boolean {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  );
}

function buildMonthlySalesPoints(
  sales: Array<{ sold_at: string; sold_price: number }>,
): DashboardMonthlySalesPoint[] {
  const buckets = getLastSixMonthBuckets();
  const grouped = new Map<string, { revenue: number; soldCount: number }>();

  for (const bucket of buckets) {
    grouped.set(bucket.monthKey, { revenue: 0, soldCount: 0 });
  }

  for (const sale of sales) {
    const date = new Date(sale.sold_at);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = grouped.get(monthKey);

    if (!bucket) {
      continue;
    }

    bucket.revenue += sale.sold_price;
    bucket.soldCount += 1;
  }

  return buckets.map((bucket) => {
    const totals = grouped.get(bucket.monthKey) ?? { revenue: 0, soldCount: 0 };

    return {
      label: bucket.label,
      monthKey: bucket.monthKey,
      revenue: totals.revenue,
      soldCount: totals.soldCount,
    };
  });
}

function buildInventoryByMakeSegments(
  vehicles: Array<{ brand: string }>,
): DashboardChartSegment[] {
  const counts = new Map<string, number>();

  for (const vehicle of vehicles) {
    const make = vehicle.brand.trim() || "Unspecified";
    counts.set(make, (counts.get(make) ?? 0) + 1);
  }

  const sorted = Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
  const topMakes = sorted.slice(0, 8);
  const otherCount = sorted.slice(8).reduce((sum, [, count]) => sum + count, 0);
  const segments = topMakes.map(([label, value], index) => ({
    color: MAKE_CHART_COLORS[index % MAKE_CHART_COLORS.length],
    label,
    value,
  }));

  if (otherCount > 0) {
    segments.push({
      color: "#a8a29e",
      label: "Other",
      value: otherCount,
    });
  }

  return segments;
}

function buildPipelineSegments(
  inquiries: Array<{ status: InquiryStatus }>,
): DashboardChartSegment[] {
  const counts = new Map<InquiryStatus, number>();

  for (const status of PIPELINE_STAGE_SEQUENCE) {
    counts.set(status, 0);
  }

  for (const inquiry of inquiries) {
    counts.set(inquiry.status, (counts.get(inquiry.status) ?? 0) + 1);
  }

  return PIPELINE_STAGE_SEQUENCE.map((status) => ({
    color: PIPELINE_STATUS_COLORS[status],
    label: getInquiryStatusLabel(status),
    value: counts.get(status) ?? 0,
  }));
}

function buildLeadSourceSegments(
  inquiries: Array<{ source_type: InquirySourceType | null }>,
): DashboardChartSegment[] {
  const palette = ["#dc2626", "#2563eb", "#d97706", "#0891b2", "#7c3aed", "#71717a"];
  const counts = new Map<string, number>();

  for (const inquiry of inquiries) {
    const key = inquiry.source_type ?? "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([sourceType, value], index) => ({
      color: palette[index % palette.length],
      label: getInquirySourceLabel(sourceType as InquirySourceType),
      value,
    }));
}

export async function getDashboardData(
  access: AdminAccessContext,
): Promise<DashboardData> {
  const adminSupabase = createSupabaseAdminClient();
  const canViewSalesData = canViewSales(access.membership.role);
  const [vehiclesResponse, inquiriesResponse, salesResponse, recentInquiriesResponse, collections] =
    await Promise.all([
      adminSupabase
        .from("vehicles")
        .select("status, availability, featured_image_url, brand")
        .eq("dealership_id", access.dealership.id),
      adminSupabase
        .from("inquiries")
        .select("status, source_type, created_at")
        .eq("dealership_id", access.dealership.id),
      canViewSalesData
        ? adminSupabase
            .from("vehicle_sales")
            .select("sold_at, sold_price")
            .eq("dealership_id", access.dealership.id)
        : Promise.resolve({ data: [] as Array<{ sold_at: string; sold_price: number }> }),
      adminSupabase
        .from("inquiries")
        .select(
          "id, status, source_type, customer:customers(full_name), vehicle:vehicles(title)",
        )
        .eq("dealership_id", access.dealership.id)
        .order("created_at", { ascending: false })
        .limit(5),
      canViewSalesData ? getSalesCollectionsSummary(access) : Promise.resolve(null),
    ]);

  const vehicles = vehiclesResponse.data ?? [];
  const inquiries = inquiriesResponse.data ?? [];
  const sales = salesResponse.data ?? [];
  const activePipeline = inquiries.filter(
    (inquiry) => inquiry.status !== "won" && inquiry.status !== "lost",
  ).length;
  const salesThisMonth = sales.filter((sale) => isInCurrentMonth(sale.sold_at));
  const inquiriesThisMonth = inquiries.filter((inquiry) =>
    isInCurrentMonth(inquiry.created_at),
  ).length;

  return {
    inventoryByMake: buildInventoryByMakeSegments(
      vehicles as Array<{ brand: string }>,
    ),
    leadSources: buildLeadSourceSegments(
      inquiries as Array<{ source_type: InquirySourceType | null }>,
    ),
    metrics: {
      activePipeline,
      availableVehicles: vehicles.filter((vehicle) => vehicle.availability === "available")
        .length,
      inquiriesThisMonth,
      openBalanceTotal: collections?.openBalanceTotal ?? null,
      overduePlans: collections?.overdueCount ?? null,
      salesRevenueThisMonth: canViewSalesData
        ? salesThisMonth.reduce((sum, sale) => sum + sale.sold_price, 0)
        : null,
      salesThisMonth: salesThisMonth.length,
      totalInquiries: inquiries.length,
      totalVehicles: vehicles.length,
    },
    monthlySales: buildMonthlySalesPoints(sales),
    needsAttention: {
      draftCount: vehicles.filter((vehicle) => vehicle.status === "draft").length,
      missingPhotoCount: vehicles.filter(
        (vehicle) => vehicle.status === "published" && !vehicle.featured_image_url,
      ).length,
    },
    pipelineByStage: buildPipelineSegments(
      inquiries as Array<{ status: InquiryStatus }>,
    ),
    recentInquiries: (
      (recentInquiriesResponse.data ?? []) as Array<{
        customer: { full_name: string | null } | Array<{ full_name: string | null }> | null;
        id: string;
        source_type: InquirySourceType | null;
        status: InquiryStatus;
        vehicle: { title: string } | Array<{ title: string }> | null;
      }>
    ).map((inquiry) => {
      const customer = Array.isArray(inquiry.customer)
        ? inquiry.customer[0]
        : inquiry.customer;
      const vehicle = Array.isArray(inquiry.vehicle) ? inquiry.vehicle[0] : inquiry.vehicle;

      return {
        customerName: customer?.full_name?.trim() || "Unknown customer",
        id: inquiry.id,
        sourceLabel: getInquirySourceLabel(inquiry.source_type as InquirySourceType),
        status: inquiry.status as InquiryStatus,
        vehicleTitle: vehicle?.title ?? null,
      };
    }),
  };
}
