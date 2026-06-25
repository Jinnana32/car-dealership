import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminAccessContext } from "@/lib/auth/types";
import type { Customer } from "@/features/customers/types";
import type { Inquiry } from "@/features/inquiries/types";
import type { Vehicle } from "@/features/vehicles/types";
import type {
  SaleCustomerOption,
  SaleInquiryOption,
  VehicleSale,
  VehicleSaleRecord,
  VehicleSalesContext,
} from "@/features/sales/types";

type ProfileSummary = {
  email: string | null;
  full_name: string | null;
  id: string;
};

function buildProfileName(profile: ProfileSummary): string {
  return profile.full_name?.trim() || profile.email || "Team member";
}

export async function mapVehicleSaleRecords(
  access: AdminAccessContext,
  sales: VehicleSale[],
): Promise<VehicleSaleRecord[]> {
  if (sales.length === 0) {
    return [];
  }

  const adminSupabase = createSupabaseAdminClient();
  const customerIds = Array.from(
    new Set(
      sales
        .map((sale) => sale.customer_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const inquiryIds = Array.from(
    new Set(
      sales
        .map((sale) => sale.inquiry_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const profileIds = Array.from(
    new Set(
      sales
        .map((sale) => sale.created_by)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const vehicleIds = Array.from(new Set(sales.map((sale) => sale.vehicle_id)));

  const [customersResponse, inquiriesResponse, profilesResponse, vehiclesResponse] =
    await Promise.all([
      customerIds.length > 0
        ? adminSupabase
            .from("customers")
            .select("id, full_name")
            .eq("dealership_id", access.dealership.id)
            .in("id", customerIds)
        : Promise.resolve({
            data: [] as Array<Pick<Customer, "full_name" | "id">>,
          }),
      inquiryIds.length > 0
        ? adminSupabase
            .from("inquiries")
            .select("id, source_type, status")
            .eq("dealership_id", access.dealership.id)
            .in("id", inquiryIds)
        : Promise.resolve({
            data: [] as Array<Pick<Inquiry, "id" | "source_type" | "status">>,
          }),
      profileIds.length > 0
        ? adminSupabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", profileIds)
        : Promise.resolve({
            data: [] as ProfileSummary[],
          }),
      vehicleIds.length > 0
        ? adminSupabase
            .from("vehicles")
            .select("id, slug, title")
            .eq("dealership_id", access.dealership.id)
            .in("id", vehicleIds)
        : Promise.resolve({
            data: [] as Array<Pick<Vehicle, "id" | "slug" | "title">>,
          }),
    ]);

  const customersById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer]),
  );
  const inquiriesById = new Map(
    (inquiriesResponse.data ?? []).map((inquiry) => [inquiry.id, inquiry]),
  );
  const profilesById = new Map(
    (profilesResponse.data ?? []).map((profile) => [
      profile.id,
      buildProfileName(profile),
    ]),
  );
  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );

  return sales.map((sale) => ({
    ...sale,
    createdByName: sale.created_by
      ? profilesById.get(sale.created_by) ?? null
      : null,
    customer: sale.customer_id ? customersById.get(sale.customer_id) ?? null : null,
    inquiry: sale.inquiry_id ? inquiriesById.get(sale.inquiry_id) ?? null : null,
    vehicle: vehiclesById.get(sale.vehicle_id) ?? null,
  }));
}

export async function getVehicleSaleRecordByInquiryId(
  access: AdminAccessContext,
  inquiryId: string,
): Promise<VehicleSaleRecord | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("vehicle_sales")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("inquiry_id", inquiryId)
    .maybeSingle<VehicleSale>();

  if (!data) {
    return null;
  }

  const [record] = await mapVehicleSaleRecords(access, [data]);

  return record ?? null;
}

export async function getVehicleSalesContext(
  access: AdminAccessContext,
  vehicleId: string,
): Promise<VehicleSalesContext> {
  const adminSupabase = createSupabaseAdminClient();
  const [salesResponse, inquiriesResponse, customersResponse] = await Promise.all([
    adminSupabase
      .from("vehicle_sales")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("vehicle_id", vehicleId)
      .maybeSingle<VehicleSale>(),
    adminSupabase
      .from("inquiries")
      .select("id, customer_id, assigned_to, vehicle_id, status, source_type")
      .eq("dealership_id", access.dealership.id)
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("customers")
      .select("id, full_name")
      .eq("dealership_id", access.dealership.id)
      .order("full_name", { ascending: true }),
  ]);

  const relatedCustomerIds = Array.from(
    new Set((inquiriesResponse.data ?? []).map((inquiry) => inquiry.customer_id)),
  );
  const relatedCustomersById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer.full_name]),
  );
  const saleRecord = salesResponse.data
    ? (await mapVehicleSaleRecords(access, [salesResponse.data]))[0] ?? null
    : null;
  const relatedInquiries: SaleInquiryOption[] = (inquiriesResponse.data ?? []).map((inquiry) => ({
    ...inquiry,
    customerName:
      relatedCustomersById.get(inquiry.customer_id) ?? "Customer unavailable",
    sourceType: inquiry.source_type,
    vehicleTitle: null,
  }));
  const customerOptions: SaleCustomerOption[] = (customersResponse.data ?? []).map((customer) => ({
    full_name: customer.full_name,
    id: customer.id,
  }));

  void relatedCustomerIds;

  return {
    customerOptions,
    relatedInquiries,
    sale: saleRecord,
  };
}
