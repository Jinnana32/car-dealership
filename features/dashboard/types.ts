import type { InquiryStatus } from "@/features/inquiries/types";

export type DashboardChartSegment = {
  color: string;
  label: string;
  value: number;
};

export type DashboardMonthlySalesPoint = {
  label: string;
  monthKey: string;
  revenue: number;
  soldCount: number;
};

export type DashboardRecentInquiry = {
  customerName: string;
  id: string;
  sourceLabel: string;
  status: InquiryStatus;
  vehicleTitle: string | null;
};

export type DashboardData = {
  inventoryByMake: DashboardChartSegment[];
  leadSources: DashboardChartSegment[];
  metrics: {
    activePipeline: number;
    availableVehicles: number;
    inquiriesThisMonth: number;
    openBalanceTotal: number | null;
    overduePlans: number | null;
    salesRevenueThisMonth: number | null;
    salesThisMonth: number;
    totalInquiries: number;
    totalVehicles: number;
  };
  monthlySales: DashboardMonthlySalesPoint[];
  needsAttention: {
    draftCount: number;
    missingPhotoCount: number;
  };
  pipelineByStage: DashboardChartSegment[];
  recentInquiries: DashboardRecentInquiry[];
};
