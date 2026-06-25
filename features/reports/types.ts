import type { Customer } from "@/features/customers/types";
import type {
  InquirySourceType,
  InquiryStatus,
  PaymentPreference,
} from "@/features/inquiries/types";
import type {
  InquiryFollowUpBucket,
} from "@/features/pipeline/types";
import type { VehicleSalePaymentType } from "@/features/sales/types";
import type {
  Vehicle,
  VehicleAvailability,
  VehicleStatus,
} from "@/features/vehicles/types";

export type ReportsOverviewData = {
  availableVehicles: number;
  lostInquiries: number;
  soldVehicles: number;
  topLeadSource: string | null;
  totalInquiries: number;
  totalSalesAmount: number;
  totalVehicles: number;
  reservedVehicles: number;
  wonInquiries: number;
};

export type SalesReportFilters = {
  from: string;
  paymentType: Exclude<VehicleSalePaymentType, null> | "all";
  soldById: string;
  to: string;
  vehicleId: string;
};

export type SalesReportRow = {
  askingPrice: number | null;
  createdByName: string | null;
  customer: Pick<Customer, "full_name" | "id"> | null;
  id: string;
  inquiry: {
    id: string;
    sourceType: InquirySourceType | null;
  } | null;
  paymentType: VehicleSalePaymentType;
  soldAt: string;
  soldPrice: number;
  vehicle: {
    id: string;
    title: string;
  } | null;
};

export type SalesReportMetrics = {
  averageSoldPrice: number;
  highestSoldPrice: number | null;
  lowestSoldPrice: number | null;
  soldCount: number;
  totalSalesAmount: number;
};

export type SalesReportResult = {
  filters: SalesReportFilters;
  metrics: SalesReportMetrics;
  rows: SalesReportRow[];
  totalCount: number;
};

export type InventoryReportFilters = {
  availability: VehicleAvailability | "all";
  brand: string;
  maxPrice: number | null;
  minPrice: number | null;
  model: string;
  status: VehicleStatus | "all";
};

export type InventoryReportRow = Pick<
  Vehicle,
  | "availability"
  | "brand"
  | "created_at"
  | "id"
  | "mileage"
  | "model"
  | "price"
  | "status"
  | "title"
  | "updated_at"
  | "year"
> & {
  inquiriesCount: number;
};

export type InventoryReportMetrics = {
  archivedVehicles: number;
  averagePrice: number;
  availableVehicles: number;
  draftVehicles: number;
  reservedVehicles: number;
  soldVehicles: number;
  totalListedValue: number;
  totalVehicles: number;
};

export type InventoryReportResult = {
  filters: InventoryReportFilters;
  metrics: InventoryReportMetrics;
  rows: InventoryReportRow[];
  totalCount: number;
};

export type InquiryReportFilters = {
  assignedToId: string;
  from: string;
  source: InquirySourceType | "all";
  status: InquiryStatus | "all";
  to: string;
  vehicleId: string;
};

export type InquiryReportRow = {
  assignedToName: string | null;
  budgetRange: string | null;
  createdAt: string;
  customer: Pick<Customer, "full_name" | "id"> | null;
  followUpAt: string | null;
  id: string;
  paymentPreference: PaymentPreference;
  sourceType: InquirySourceType;
  status: InquiryStatus;
  vehicle: {
    id: string;
    title: string;
  } | null;
};

export type InquiryReportMetrics = {
  contacted: number;
  conversionRate: number;
  lost: number;
  negotiation: number;
  new: number;
  reserved: number;
  totalInquiries: number;
  viewingScheduled: number;
  won: number;
};

export type InquiryReportResult = {
  filters: InquiryReportFilters;
  metrics: InquiryReportMetrics;
  rows: InquiryReportRow[];
  totalCount: number;
};

export type LeadSourceReportFilters = {
  from: string;
  to: string;
};

export type LeadSourceReportRow = {
  activeCount: number;
  conversionRate: number;
  lostCount: number;
  salesAmount: number;
  sourceType: InquirySourceType;
  totalInquiries: number;
  wonCount: number;
};

export type LeadSourceReportMetrics = {
  processedLeadCount: number;
  topSource: string | null;
  totalSalesAmount: number;
  totalWonLeads: number;
};

export type LeadSourceReportResult = {
  filters: LeadSourceReportFilters;
  metrics: LeadSourceReportMetrics;
  rows: LeadSourceReportRow[];
};

export type PipelineReportFilters = {
  assignedToId: string;
  from: string;
  source: InquirySourceType | "all";
  status: InquiryStatus | "all";
  to: string;
};

export type PipelineStatusSummaryRow = {
  count: number;
  newestInquiryDate: string | null;
  oldestInquiryDate: string | null;
  status: InquiryStatus;
};

export type PipelineFollowUpRow = {
  assignedToName: string | null;
  bucket: InquiryFollowUpBucket;
  customerName: string;
  followUpAt: string | null;
  id: string;
  sourceType: InquirySourceType;
  status: InquiryStatus;
  vehicleTitle: string | null;
};

export type PipelineReportMetrics = {
  averageDaysInPipeline: number;
  dueTodayCount: number;
  overdueCount: number;
  totalInquiries: number;
  wonCount: number;
  lostCount: number;
};

export type PipelineReportResult = {
  filters: PipelineReportFilters;
  followUps: PipelineFollowUpRow[];
  metrics: PipelineReportMetrics;
  rows: PipelineStatusSummaryRow[];
};
