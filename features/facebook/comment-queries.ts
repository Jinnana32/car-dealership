import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessContext } from "@/lib/auth/types";
import type { Customer } from "@/features/customers/types";
import type { Inquiry } from "@/features/inquiries/types";
import type { Vehicle } from "@/features/vehicles/types";
import type {
  FacebookCommentListResult,
  FacebookPostComment,
  FacebookPostCommentRecord,
} from "@/features/facebook/types";
import { facebookCommentHistoryFiltersSchema } from "@/features/facebook/validators";

type FacebookCommentHistorySearchParams = {
  status?: string | string[];
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFacebookCommentHistoryFilters(
  searchParams: FacebookCommentHistorySearchParams,
): FacebookCommentListResult["filters"] {
  return facebookCommentHistoryFiltersSchema.parse({
    status: getScalarValue(searchParams.status),
  });
}

async function mapFacebookCommentRelations(
  access: AdminAccessContext,
  rows: FacebookPostComment[],
): Promise<FacebookPostCommentRecord[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const customerIds = Array.from(
    new Set(rows.map((row) => row.customer_id).filter((id): id is string => Boolean(id))),
  );
  const inquiryIds = Array.from(
    new Set(rows.map((row) => row.inquiry_id).filter((id): id is string => Boolean(id))),
  );
  const vehicleIds = Array.from(
    new Set(rows.map((row) => row.vehicle_id).filter((id): id is string => Boolean(id))),
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

  const customerById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer]),
  );
  const inquiryById = new Map(
    (inquiriesResponse.data ?? []).map((inquiry) => [inquiry.id, inquiry]),
  );
  const vehicleById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );

  return rows.map((row) => ({
    ...row,
    customer: row.customer_id ? customerById.get(row.customer_id) ?? null : null,
    inquiry: row.inquiry_id ? inquiryById.get(row.inquiry_id) ?? null : null,
    vehicle: row.vehicle_id ? vehicleById.get(row.vehicle_id) ?? null : null,
  }));
}

export async function getFacebookComments(
  access: AdminAccessContext,
  searchParams: FacebookCommentHistorySearchParams,
): Promise<FacebookCommentListResult> {
  const filters = parseFacebookCommentHistoryFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("facebook_post_comments")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("received_at", { ascending: false });

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      comments: [],
      failedCount: 0,
      filters,
      latestReceivedAt: null,
      processedCount: 0,
      receivedCount: 0,
      totalCount: 0,
    };
  }

  const comments = await mapFacebookCommentRelations(access, data as FacebookPostComment[]);

  return {
    comments,
    failedCount: comments.filter((comment) => comment.status === "failed").length,
    filters,
    latestReceivedAt: comments[0]?.received_at ?? null,
    processedCount: comments.filter((comment) => comment.status === "processed").length,
    receivedCount: comments.filter((comment) => comment.status === "received").length,
    totalCount: comments.length,
  };
}
