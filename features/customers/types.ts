import type { Database } from "@/lib/supabase/database.types";
import type { InquirySummaryItem } from "@/features/inquiries/types";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
export type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

export type CustomerListItem = Customer & {
  inquiryCount: number;
};

export type CustomerListResult = {
  filters: {
    search: string;
  };
  totalCount: number;
  customers: CustomerListItem[];
};

export type CustomerDuplicateMatch = {
  email: string | null;
  full_name: string;
  id: string;
  inquiryCount: number;
  phone: string | null;
};

export type CustomerRecord = {
  customer: Customer;
  inquiries: InquirySummaryItem[];
};

export type CustomerLookupResult =
  | { type: "forbidden" }
  | { type: "not_found" }
  | { record: CustomerRecord; type: "ok" };
