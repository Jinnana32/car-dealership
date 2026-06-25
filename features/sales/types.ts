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
  inquiry: Pick<Inquiry, "id" | "source_type" | "status"> | null;
  vehicle: {
    id: string;
    slug: string;
    title: string;
  } | null;
};

export type VehicleSalesContext = {
  customerOptions: SaleCustomerOption[];
  relatedInquiries: SaleInquiryOption[];
  sale: VehicleSaleRecord | null;
};
