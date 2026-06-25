import type { AppRole } from "@/lib/auth/types";
import type { Database } from "@/lib/supabase/database.types";
import type { Customer } from "@/features/customers/types";
import type { InquiryFollowUpBucket, InquiryFollowUpFilter } from "@/features/pipeline/types";

export type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];
export type InquiryInsert = Database["public"]["Tables"]["inquiries"]["Insert"];
export type InquiryUpdate = Database["public"]["Tables"]["inquiries"]["Update"];
export type InquiryEvent = Database["public"]["Tables"]["inquiry_events"]["Row"];
export type LeadSourceEvent =
  Database["public"]["Tables"]["lead_source_events"]["Row"];
export type InquirySourceType = Inquiry["source_type"];
export type InquiryStatus = Inquiry["status"];
export type PaymentPreference = Inquiry["payment_preference"];

export type InquirySourceFilter = InquirySourceType | "all";
export type InquiryStatusFilter = InquiryStatus | "all";

export type DealershipMemberOption = {
  label: string;
  profileId: string;
  role: AppRole;
};

export type VehicleOption = {
  id: string;
  label: string;
};

export type InquiryListItem = Inquiry & {
  assignedToName: string | null;
  customer: Pick<Customer, "email" | "full_name" | "id" | "phone"> | null;
  followUpBucket: InquiryFollowUpBucket;
  lastNotePreview: string | null;
  vehicle: {
    id: string;
    title: string;
  } | null;
};

export type InquirySummaryItem = {
  assignedToName: string | null;
  created_at: string;
  customer_id: string;
  id: string;
  next_follow_up_at: string | null;
  payment_preference: PaymentPreference;
  source_type: InquirySourceType;
  status: InquiryStatus;
  vehicle: {
    id: string;
    title: string;
  } | null;
};

export type InquiryEventItem = InquiryEvent & {
  createdByName: string | null;
};

export type InquiryRecord = {
  customer: Customer;
  events: InquiryEventItem[];
  inquiry: Inquiry;
  vehicle: {
    id: string;
    price: number | null;
    title: string;
  } | null;
};

export type InquiryLookupResult =
  | { type: "forbidden" }
  | { type: "not_found" }
  | { record: InquiryRecord; type: "ok" };

export type InquiryListResult = {
  filters: {
    assignedToId: string;
    followUp: InquiryFollowUpFilter;
    search: string;
    source: InquirySourceFilter;
    status: InquiryStatusFilter;
    vehicleId: string;
  };
  inquiries: InquiryListItem[];
  totalCount: number;
};

export type ManualLeadFormValues = {
  assigned_to: string;
  budget_range: string;
  customer_name: string;
  duplicate_resolution: "create_new" | "use_existing" | "";
  email: string;
  existing_customer_id: string;
  interested_vehicle_id: string;
  message: string;
  next_follow_up_at: string;
  payment_preference: PaymentPreference | "";
  phone: string;
  source_detail: string;
  source_type: Extract<
    InquirySourceType,
    | "manual_entry"
    | "phone_call"
    | "walk_in"
    | "referral"
    | "facebook_comment"
    | "viber"
    | "whatsapp"
    | "other"
  >;
  status: InquiryStatus;
};

export type ManualLeadFormState = {
  duplicates?: import("@/features/customers/types").CustomerDuplicateMatch[];
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
  values?: ManualLeadFormValues;
};
