import type { Customer } from "@/features/customers/types";
import type { Inquiry } from "@/features/inquiries/types";
import type { Database } from "@/lib/supabase/database.types";

export type VehicleSale = Database["public"]["Tables"]["vehicle_sales"]["Row"];
export type VehicleSaleInsert =
  Database["public"]["Tables"]["vehicle_sales"]["Insert"];
export type VehicleSaleUpdate =
  Database["public"]["Tables"]["vehicle_sales"]["Update"];
export type VehicleSalePaymentType = VehicleSale["payment_type"];

export type SaleCustomerOption = Pick<Customer, "full_name" | "id">;

export type SaleInquiryOption = Pick<
  Inquiry,
  "assigned_to" | "customer_id" | "id" | "status" | "vehicle_id"
> & {
  customerName: string;
  sourceType: Inquiry["source_type"];
  vehicleTitle: string | null;
};

export type VehicleSaleRecord = VehicleSale & {
  createdByName: string | null;
  customer: Pick<Customer, "full_name" | "id"> | null;
  inquiry: Pick<Inquiry, "assigned_to" | "id" | "source_type" | "status"> | null;
  vehicle: {
    id: string;
    slug: string;
    title: string;
  } | null;
};

export type VehicleSalesContext = {
  customerOptions: SaleCustomerOption[];
  paymentPlan: SalePaymentPlan | null;
  relatedInquiries: SaleInquiryOption[];
  sale: VehicleSaleRecord | null;
};

export type SalesListPaymentTypeFilter = Exclude<VehicleSalePaymentType, null> | "all";

export type SalesListFilters = {
  from: string;
  paymentType: SalesListPaymentTypeFilter;
  search: string;
  soldById: string;
  to: string;
  vehicleId: string;
};

export type SalesListSummary = {
  averageSoldPrice: number;
  cashCount: number;
  financingCount: number;
  soldCount: number;
  totalSalesAmount: number;
};

export type SalesListResult = {
  filters: SalesListFilters;
  sales: VehicleSaleRecord[];
  summary: SalesListSummary;
  totalCount: number;
};

export type SaleLookupResult =
  | { type: "forbidden" }
  | { type: "not_found" }
  | {
      ledger: SaleLedgerContext;
      paymentPlan: SalePaymentPlan | null;
      record: VehicleSaleRecord;
      type: "ok";
    };

export type SalePayment = Database["public"]["Tables"]["sale_payments"]["Row"];
export type SalePaymentInsert = Database["public"]["Tables"]["sale_payments"]["Insert"];
export type SalePaymentUpdate = Database["public"]["Tables"]["sale_payments"]["Update"];
export type SalePaymentMethod = SalePayment["payment_method"];
export type SalePaymentStatus = SalePayment["status"];

export type SalePaymentScheduleItem =
  Database["public"]["Tables"]["sale_payment_schedule_items"]["Row"];
export type SalePaymentScheduleItemInsert =
  Database["public"]["Tables"]["sale_payment_schedule_items"]["Insert"];

export type SalePaymentRecord = SalePayment & {
  recordedByName: string | null;
};

export type SaleLedgerSummary = {
  balanceRemaining: number;
  collectedAtClosing: number;
  hasOverdueSchedule: boolean;
  ledgerPaid: number;
  paidToDate: number;
};

export type SaleLedgerContext = {
  canRecordPayment: boolean;
  canVoidPayments: boolean;
  payments: SalePaymentRecord[];
  scheduleItems: SalePaymentScheduleItem[];
  summary: SaleLedgerSummary;
};

export type SalesCollectionsSummary = {
  openBalanceTotal: number;
  overdueCount: number;
};

export type SalePaymentsReportRow = {
  amount: number;
  customerName: string | null;
  id: string;
  notes: string | null;
  paidAt: string;
  paymentMethod: SalePaymentMethod;
  recordedByName: string | null;
  referenceNumber: string | null;
  saleId: string;
  status: SalePaymentStatus;
  vehicleTitle: string | null;
};

export type SalePaymentsReportResult = {
  rows: SalePaymentsReportRow[];
  totalCount: number;
};

export type SalePaymentPlan = Database["public"]["Tables"]["sale_payment_plans"]["Row"];
export type SalePaymentPlanInsert =
  Database["public"]["Tables"]["sale_payment_plans"]["Insert"];
export type SalePaymentPlanUpdate =
  Database["public"]["Tables"]["sale_payment_plans"]["Update"];
export type SalePaymentPlanEvent =
  Database["public"]["Tables"]["sale_payment_plan_events"]["Row"];
export type SalePaymentPlanType = SalePaymentPlan["plan_type"];
export type SalePaymentPlanStatus = SalePaymentPlan["status"];

export type RecordVehicleSaleFormValues = {
  asking_price: string;
  confirm: string;
  customer_id: string;
  down_payment_amount: string;
  down_payment_input_mode: string;
  down_payment_value: string;
  financier_name: string;
  inquiry_id: string;
  monthly_payment: string;
  notes: string;
  payment_type: string;
  plan_tbd: string;
  redirect_to: string;
  sold_at: string;
  sold_price: string;
  term_months: string;
  term_years: string;
  trade_in_amount: string;
  vehicle_id: string;
};

export type RecordVehicleSaleFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
  message?: string;
  success?: boolean;
  values?: RecordVehicleSaleFormValues;
};
