import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessContext } from "@/lib/auth/types";
import { getDealershipMemberOptions } from "@/features/inquiries/queries";
import type {
  Inquiry,
  InquirySummaryItem,
} from "@/features/inquiries/types";
import { customerListFiltersSchema } from "@/features/customers/validators";
import type {
  Customer,
  CustomerListItem,
  CustomerListResult,
  CustomerLookupResult,
} from "@/features/customers/types";

type CustomerFiltersInput = {
  search?: string | string[];
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCustomerListFilters(
  searchParams: CustomerFiltersInput,
): CustomerListResult["filters"] {
  return customerListFiltersSchema.parse({
    search: getScalarValue(searchParams.search),
  });
}

export async function getCustomersList(
  access: AdminAccessContext,
  searchParams: CustomerFiltersInput,
): Promise<CustomerListResult> {
  const filters = parseCustomerListFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("customers")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.or(
      [
        `full_name.ilike.%${filters.search}%`,
        `phone.ilike.%${filters.search}%`,
        `email.ilike.%${filters.search}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      customers: [],
      filters,
      totalCount: 0,
    };
  }

  const customerIds = data.map((customer) => customer.id);

  if (customerIds.length === 0) {
    return {
      customers: [],
      filters,
      totalCount: 0,
    };
  }

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("customer_id")
    .eq("dealership_id", access.dealership.id)
    .in("customer_id", customerIds);

  const inquiryCounts = new Map<string, number>();

  for (const inquiry of inquiries ?? []) {
    inquiryCounts.set(
      inquiry.customer_id,
      (inquiryCounts.get(inquiry.customer_id) ?? 0) + 1,
    );
  }

  return {
    customers: data.map(
      (customer): CustomerListItem => ({
        ...customer,
        inquiryCount: inquiryCounts.get(customer.id) ?? 0,
      }),
    ),
    filters,
    totalCount: data.length,
  };
}

export async function getCustomerById(
  access: AdminAccessContext,
  customerId: string,
): Promise<CustomerLookupResult> {
  const supabase = await createSupabaseServerClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", customerId)
    .maybeSingle<Customer>();

  if (error) {
    return { type: "not_found" };
  }

  if (!customer) {
    const adminSupabase = createSupabaseAdminClient();
    const { data: existingCustomer } = await adminSupabase
      .from("customers")
      .select("id, dealership_id")
      .eq("id", customerId)
      .maybeSingle<Pick<Customer, "dealership_id" | "id">>();

    if (existingCustomer && existingCustomer.dealership_id !== access.dealership.id) {
      return { type: "forbidden" };
    }

    return { type: "not_found" };
  }

  const [inquiriesResponse, memberOptions] = await Promise.all([
    supabase
      .from("inquiries")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false }),
    getDealershipMemberOptions(access),
  ]);

  const inquiries = inquiriesResponse.data ?? [];
  const vehicleIds = Array.from(
    new Set(
      inquiries
        .map((inquiry) => inquiry.vehicle_id)
        .filter((vehicleId): vehicleId is string => Boolean(vehicleId)),
    ),
  );
  const { data: vehicles } =
    vehicleIds.length > 0
      ? await supabase
          .from("vehicles")
          .select("id, title")
          .eq("dealership_id", access.dealership.id)
          .in("id", vehicleIds)
      : { data: [] };

  const vehiclesById = new Map(
    (vehicles ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );
  const membersById = new Map(
    memberOptions.map((member) => [member.profileId, member.label]),
  );

  const relatedInquiries: InquirySummaryItem[] = inquiries.map(
    (inquiry: Inquiry) => ({
      assignedToName: inquiry.assigned_to
        ? membersById.get(inquiry.assigned_to) ?? null
        : null,
      created_at: inquiry.created_at,
      customer_id: inquiry.customer_id,
      id: inquiry.id,
      next_follow_up_at: inquiry.next_follow_up_at,
      payment_preference: inquiry.payment_preference,
      source_type: inquiry.source_type,
      status: inquiry.status,
      vehicle: inquiry.vehicle_id
        ? vehiclesById.get(inquiry.vehicle_id) ?? null
        : null,
    }),
  );

  return {
    record: {
      customer,
      inquiries: relatedInquiries,
    },
    type: "ok",
  };
}
