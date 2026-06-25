import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessContext } from "@/lib/auth/types";
import type { Customer, CustomerDuplicateMatch } from "@/features/customers/types";
import type {
  DealershipMemberOption,
  Inquiry,
  InquiryEvent,
  InquiryEventItem,
  InquiryListItem,
  InquiryListResult,
  InquiryLookupResult,
  VehicleOption,
} from "@/features/inquiries/types";
import { inquiryListFiltersSchema } from "@/features/inquiries/validators";
import {
  getFollowUpBucket,
  truncatePipelineNote,
} from "@/features/pipeline/utils";

type InquiryFiltersInput = {
  assignedToId?: string | string[];
  followUp?: string | string[];
  search?: string | string[];
  source?: string | string[];
  status?: string | string[];
  vehicleId?: string | string[];
};

type ProfileSummary = {
  email: string | null;
  full_name: string | null;
  id: string;
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function createDisplayName(profile: ProfileSummary): string {
  return profile.full_name?.trim() || profile.email || "Team member";
}

export function parseInquiryListFilters(
  searchParams: InquiryFiltersInput,
): InquiryListResult["filters"] {
  const parsed = inquiryListFiltersSchema.parse({
    assignedToId: getScalarValue(searchParams.assignedToId),
    followUp: getScalarValue(searchParams.followUp),
    search: getScalarValue(searchParams.search),
    source: getScalarValue(searchParams.source),
    status: getScalarValue(searchParams.status),
    vehicleId: getScalarValue(searchParams.vehicleId),
  });

  return parsed;
}

export async function getDealershipMemberOptions(
  access: AdminAccessContext,
): Promise<DealershipMemberOption[]> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: memberships } = await adminSupabase
    .from("dealership_members")
    .select("profile_id, role, created_at")
    .eq("dealership_id", access.dealership.id)
    .order("created_at", { ascending: true });

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const profileIds = memberships.map((membership) => membership.profile_id);
  const { data: profiles } = await adminSupabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", profileIds);

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return memberships
    .map((membership) => {
      const profile = profilesById.get(membership.profile_id);

      if (!profile) {
        return null;
      }

      return {
        label: createDisplayName(profile),
        profileId: membership.profile_id,
        role: membership.role,
      };
    })
    .filter((option): option is DealershipMemberOption => Boolean(option));
}

export async function getVehicleOptions(
  access: AdminAccessContext,
): Promise<VehicleOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id, title, brand, model, year")
    .eq("dealership_id", access.dealership.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  return (data ?? []).map((vehicle) => ({
    id: vehicle.id,
    label: vehicle.title || [vehicle.brand, vehicle.model, vehicle.year]
      .filter(Boolean)
      .join(" "),
  }));
}

export async function searchPossibleCustomerDuplicatesInDealership(
  access: AdminAccessContext,
  input: {
    customerName: string;
    email: string | null;
    phone: string | null;
  },
): Promise<CustomerDuplicateMatch[]> {
  const supabase = await createSupabaseServerClient();
  const matchById = new Map<string, Customer>();

  if (input.phone) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("phone", input.phone);

    for (const customer of data ?? []) {
      matchById.set(customer.id, customer);
    }
  }

  if (input.email) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .ilike("email", input.email);

    for (const customer of data ?? []) {
      matchById.set(customer.id, customer);
    }
  }

  const { data: nameMatches } = await supabase
    .from("customers")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .ilike("full_name", input.customerName);

  for (const customer of nameMatches ?? []) {
    matchById.set(customer.id, customer);
  }

  const customers = Array.from(matchById.values());

  if (customers.length === 0) {
    return [];
  }

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("customer_id")
    .eq("dealership_id", access.dealership.id)
    .in(
      "customer_id",
      customers.map((customer) => customer.id),
    );

  const inquiryCounts = new Map<string, number>();

  for (const inquiry of inquiries ?? []) {
    inquiryCounts.set(
      inquiry.customer_id,
      (inquiryCounts.get(inquiry.customer_id) ?? 0) + 1,
    );
  }

  return customers
    .map((customer) => ({
      email: customer.email,
      full_name: customer.full_name,
      id: customer.id,
      inquiryCount: inquiryCounts.get(customer.id) ?? 0,
      phone: customer.phone,
    }))
    .sort((left, right) => left.full_name.localeCompare(right.full_name));
}

export async function getInquiriesList(
  access: AdminAccessContext,
  searchParams: InquiryFiltersInput,
): Promise<InquiryListResult> {
  const filters = parseInquiryListFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("inquiries")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("created_at", { ascending: false });

  if (filters.source !== "all") {
    query = query.eq("source_type", filters.source);
  }

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.assignedToId) {
    query = query.eq("assigned_to", filters.assignedToId);
  }

  if (filters.vehicleId) {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      filters,
      inquiries: [],
      totalCount: 0,
    };
  }

  const customerIds = Array.from(
    new Set(data.map((inquiry) => inquiry.customer_id)),
  );
  const vehicleIds = Array.from(
    new Set(
      data
        .map((inquiry) => inquiry.vehicle_id)
        .filter((vehicleId): vehicleId is string => Boolean(vehicleId)),
    ),
  );

  const [customersResponse, vehiclesResponse, memberOptions] = await Promise.all([
    customerIds.length > 0
      ? supabase
          .from("customers")
          .select("id, full_name, phone, email")
          .eq("dealership_id", access.dealership.id)
          .in("id", customerIds)
      : Promise.resolve({ data: [] }),
    vehicleIds.length > 0
      ? supabase
          .from("vehicles")
          .select("id, title")
          .eq("dealership_id", access.dealership.id)
          .in("id", vehicleIds)
      : Promise.resolve({ data: [] }),
    getDealershipMemberOptions(access),
  ]);

  const { data: noteEvents } =
    data.length > 0
      ? await supabase
          .from("inquiry_events")
          .select("inquiry_id, note, created_at")
          .eq("dealership_id", access.dealership.id)
          .in(
            "inquiry_id",
            data.map((inquiry) => inquiry.id),
          )
          .not("note", "is", null)
          .order("created_at", { ascending: false })
      : { data: [] };

  const customersById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer]),
  );
  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );
  const membersById = new Map(
    memberOptions.map((member) => [member.profileId, member.label]),
  );
  const lastNoteByInquiryId = new Map<string, string>();

  for (const event of noteEvents ?? []) {
    if (!event.note || lastNoteByInquiryId.has(event.inquiry_id)) {
      continue;
    }

    lastNoteByInquiryId.set(event.inquiry_id, event.note);
  }

  let inquiries: InquiryListItem[] = data.map((inquiry) => ({
    ...inquiry,
    assignedToName: inquiry.assigned_to
      ? membersById.get(inquiry.assigned_to) ?? null
      : null,
    customer: customersById.get(inquiry.customer_id) ?? null,
    followUpBucket: getFollowUpBucket(inquiry.next_follow_up_at),
    lastNotePreview: truncatePipelineNote(
      lastNoteByInquiryId.get(inquiry.id) ?? null,
    ),
    vehicle: inquiry.vehicle_id ? vehiclesById.get(inquiry.vehicle_id) ?? null : null,
  }));

  if (filters.followUp !== "all") {
    inquiries = inquiries.filter(
      (inquiry) => inquiry.followUpBucket === filters.followUp,
    );
  }

  if (filters.search) {
    const normalizedSearch = filters.search.trim().toLowerCase();

    inquiries = inquiries.filter((inquiry) => {
      const haystack = [
        inquiry.customer?.full_name,
        inquiry.customer?.phone,
        inquiry.customer?.email,
        inquiry.vehicle?.title,
        inquiry.assignedToName,
        inquiry.lastNotePreview,
        inquiry.source_detail,
        inquiry.original_message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }

  return {
    filters,
    inquiries,
    totalCount: inquiries.length,
  };
}

export async function getInquiryById(
  access: AdminAccessContext,
  inquiryId: string,
): Promise<InquiryLookupResult> {
  const supabase = await createSupabaseServerClient();
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiryId)
    .maybeSingle<Inquiry>();

  if (error) {
    return { type: "not_found" };
  }

  if (!inquiry) {
    const adminSupabase = createSupabaseAdminClient();
    const { data: existingInquiry } = await adminSupabase
      .from("inquiries")
      .select("id, dealership_id")
      .eq("id", inquiryId)
      .maybeSingle<Pick<Inquiry, "dealership_id" | "id">>();

    if (existingInquiry && existingInquiry.dealership_id !== access.dealership.id) {
      return { type: "forbidden" };
    }

    return { type: "not_found" };
  }

  const [
    customerResponse,
    vehicleResponse,
    eventsResponse,
    memberOptions,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("id", inquiry.customer_id)
      .maybeSingle<Customer>(),
    inquiry.vehicle_id
      ? supabase
          .from("vehicles")
          .select("id, title, price")
          .eq("dealership_id", access.dealership.id)
          .eq("id", inquiry.vehicle_id)
          .maybeSingle<{ id: string; price: number | null; title: string }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("inquiry_events")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .eq("inquiry_id", inquiry.id)
      .order("created_at", { ascending: false }),
    getDealershipMemberOptions(access),
  ]);

  if (!customerResponse.data) {
    return { type: "not_found" };
  }

  const membersById = new Map(
    memberOptions.map((member) => [member.profileId, member.label]),
  );
  const events: InquiryEventItem[] = (eventsResponse.data ?? []).map(
    (event: InquiryEvent) => ({
      ...event,
      createdByName: event.created_by
        ? membersById.get(event.created_by) ?? null
        : null,
    }),
  );

  return {
    record: {
      customer: customerResponse.data,
      events,
      inquiry,
      vehicle: vehicleResponse.data ?? null,
    },
    type: "ok",
  };
}
