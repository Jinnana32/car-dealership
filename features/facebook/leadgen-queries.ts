import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessContext } from "@/lib/auth/types";
import { getVehicleOptions } from "@/features/inquiries/queries";
import type { Customer } from "@/features/customers/types";
import type { Inquiry } from "@/features/inquiries/types";
import type { Vehicle } from "@/features/vehicles/types";
import type {
  FacebookLead,
  FacebookLeadFormMapping,
  FacebookLeadFormMappingsResult,
  FacebookLeadListResult,
  FacebookLeadLookupResult,
  FacebookLeadRecord,
} from "@/features/facebook/types";
import {
  facebookLeadFormMappingFiltersSchema,
  facebookLeadHistoryFiltersSchema,
} from "@/features/facebook/validators";

type FacebookLeadHistorySearchParams = {
  status?: string | string[];
};

type FacebookLeadFormMappingSearchParams = {
  edit?: string | string[];
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFacebookLeadHistoryFilters(
  searchParams: FacebookLeadHistorySearchParams,
): FacebookLeadListResult["filters"] {
  return facebookLeadHistoryFiltersSchema.parse({
    status: getScalarValue(searchParams.status),
  });
}

export function parseFacebookLeadFormMappingFilters(
  searchParams: FacebookLeadFormMappingSearchParams,
): FacebookLeadFormMappingsResult["filters"] {
  return facebookLeadFormMappingFiltersSchema.parse({
    edit: getScalarValue(searchParams.edit),
  });
}

async function mapFacebookLeadRelations(
  access: AdminAccessContext,
  rows: FacebookLead[],
): Promise<FacebookLeadRecord[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const customerIds = Array.from(
    new Set(
      rows
        .map((row) => row.customer_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const inquiryIds = Array.from(
    new Set(
      rows
        .map((row) => row.inquiry_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const vehicleIds = Array.from(
    new Set(
      rows
        .map((row) => row.vehicle_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [customersResponse, inquiriesResponse, vehiclesResponse] = await Promise.all([
    customerIds.length > 0
      ? supabase
          .from("customers")
          .select("id, full_name, phone, email")
          .eq("dealership_id", access.dealership.id)
          .in("id", customerIds)
      : Promise.resolve({
          data: [] as Array<Pick<Customer, "email" | "full_name" | "id" | "phone">>,
        }),
    inquiryIds.length > 0
      ? supabase
          .from("inquiries")
          .select("id, status, created_at")
          .eq("dealership_id", access.dealership.id)
          .in("id", inquiryIds)
      : Promise.resolve({
          data: [] as Array<Pick<Inquiry, "created_at" | "id" | "status">>,
        }),
    vehicleIds.length > 0
      ? supabase
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
  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );

  return rows.map((row) => ({
    ...row,
    customer: row.customer_id ? customersById.get(row.customer_id) ?? null : null,
    inquiry: row.inquiry_id ? inquiriesById.get(row.inquiry_id) ?? null : null,
    vehicle: row.vehicle_id ? vehiclesById.get(row.vehicle_id) ?? null : null,
  }));
}

async function mapFacebookLeadFormMappingRelations(
  access: AdminAccessContext,
  rows: FacebookLeadFormMapping[],
): Promise<FacebookLeadFormMappingsResult["mappings"]> {
  if (rows.length === 0) {
    return [];
  }

  const vehicleIds = Array.from(
    new Set(
      rows
        .map((row) => row.vehicle_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const supabase = await createSupabaseServerClient();
  const { data: vehicles } =
    vehicleIds.length > 0
      ? await supabase
          .from("vehicles")
          .select("id, slug, title")
          .eq("dealership_id", access.dealership.id)
          .in("id", vehicleIds)
      : { data: [] as Array<Pick<Vehicle, "id" | "slug" | "title">> };

  const vehiclesById = new Map((vehicles ?? []).map((vehicle) => [vehicle.id, vehicle]));

  return rows.map((row) => ({
    ...row,
    vehicle: row.vehicle_id ? vehiclesById.get(row.vehicle_id) ?? null : null,
  }));
}

export async function getFacebookLeads(
  access: AdminAccessContext,
  searchParams: FacebookLeadHistorySearchParams,
): Promise<FacebookLeadListResult> {
  const filters = parseFacebookLeadHistoryFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("facebook_leads")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("received_at", { ascending: false });

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const [
    rowsResponse,
    totalCountResponse,
    receivedCountResponse,
    processedCountResponse,
    failedCountResponse,
  ] = await Promise.all([
    query,
    supabase
      .from("facebook_leads")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", access.dealership.id),
    supabase
      .from("facebook_leads")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", access.dealership.id)
      .eq("status", "received"),
    supabase
      .from("facebook_leads")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", access.dealership.id)
      .eq("status", "processed"),
    supabase
      .from("facebook_leads")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", access.dealership.id)
      .eq("status", "failed"),
  ]);

  const leads = await mapFacebookLeadRelations(
    access,
    (rowsResponse.data ?? []) as FacebookLead[],
  );

  return {
    failedCount: failedCountResponse.count ?? 0,
    filters,
    latestReceivedAt: leads[0]?.received_at ?? null,
    leads,
    processedCount: processedCountResponse.count ?? 0,
    receivedCount: receivedCountResponse.count ?? 0,
    totalCount: totalCountResponse.count ?? leads.length,
  };
}

export async function getFacebookLeadDetail(
  access: AdminAccessContext,
  leadId: string,
): Promise<FacebookLeadLookupResult> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("facebook_leads")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", leadId)
    .maybeSingle<FacebookLead>();

  if (!data) {
    return {
      type: "not_found",
    };
  }

  const [record] = await mapFacebookLeadRelations(access, [data]);

  if (!record) {
    return {
      type: "forbidden",
    };
  }

  return {
    record,
    type: "ok",
  };
}

export async function getFacebookLeadFormMappings(
  access: AdminAccessContext,
  searchParams: FacebookLeadFormMappingSearchParams,
): Promise<FacebookLeadFormMappingsResult> {
  const filters = parseFacebookLeadFormMappingFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  const [rowsResponse, vehicleOptions] = await Promise.all([
    supabase
      .from("facebook_lead_form_mappings")
      .select("*")
      .eq("dealership_id", access.dealership.id)
      .order("created_at", { ascending: false }),
    getVehicleOptions(access),
  ]);
  const mappings = await mapFacebookLeadFormMappingRelations(
    access,
    (rowsResponse.data ?? []) as FacebookLeadFormMapping[],
  );
  const editingMapping =
    filters.edit.length > 0
      ? mappings.find((mapping) => mapping.id === filters.edit) ?? null
      : null;

  return {
    editingMapping,
    filters,
    mappings,
    totalCount: mappings.length,
    vehicleOptions,
  };
}
