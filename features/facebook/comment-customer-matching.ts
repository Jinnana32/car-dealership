import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

export type CustomerMatchIndex = {
  byFbCustomerId: Map<string, string>;
  byNormalizedName: Map<string, string[]>;
};

type CustomerMatchRow = {
  fb_customer_id: string | null;
  full_name: string;
  id: string;
};

export function normalizeCustomerName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildCustomerMatchIndex(
  customers: CustomerMatchRow[],
): CustomerMatchIndex {
  const byFbCustomerId = new Map<string, string>();
  const byNormalizedName = new Map<string, string[]>();

  for (const customer of customers) {
    const fbCustomerId = customer.fb_customer_id?.trim();

    if (fbCustomerId) {
      byFbCustomerId.set(fbCustomerId, customer.id);
    }

    const normalizedName = normalizeCustomerName(customer.full_name);

    if (!normalizedName) {
      continue;
    }

    const existingMatches = byNormalizedName.get(normalizedName) ?? [];
    existingMatches.push(customer.id);
    byNormalizedName.set(normalizedName, existingMatches);
  }

  return {
    byFbCustomerId,
    byNormalizedName,
  };
}

export async function loadCustomerMatchIndex(input: {
  adminSupabase?: AdminSupabaseClient;
  dealershipId: string;
}): Promise<CustomerMatchIndex> {
  const adminSupabase = input.adminSupabase ?? createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("customers")
    .select("id, full_name, fb_customer_id")
    .eq("dealership_id", input.dealershipId);

  return buildCustomerMatchIndex((data ?? []) as CustomerMatchRow[]);
}

function resolveCustomerIdFromIndex(input: {
  authorFacebookId: string | null;
  authorName: string;
  matchIndex: CustomerMatchIndex;
}): string | null {
  const fbCustomerId = input.authorFacebookId?.trim();

  if (fbCustomerId) {
    const matchedByFbId = input.matchIndex.byFbCustomerId.get(fbCustomerId);

    if (matchedByFbId) {
      return matchedByFbId;
    }
  }

  const normalizedName = normalizeCustomerName(input.authorName);
  const nameMatches = input.matchIndex.byNormalizedName.get(normalizedName) ?? [];

  if (nameMatches.length === 1) {
    return nameMatches[0] ?? null;
  }

  return null;
}

async function backfillCustomerFbId(input: {
  adminSupabase: AdminSupabaseClient;
  authorFacebookId: string;
  customerId: string;
}): Promise<void> {
  await input.adminSupabase
    .from("customers")
    .update({
      fb_customer_id: input.authorFacebookId,
    })
    .eq("id", input.customerId)
    .is("fb_customer_id", null);
}

export async function resolveCustomerForFacebookAuthor(input: {
  adminSupabase: AdminSupabaseClient;
  authorFacebookId: string | null;
  authorName: string;
  dealershipId: string;
  matchIndex?: CustomerMatchIndex;
}): Promise<string | null> {
  const matchIndex =
    input.matchIndex ??
    (await loadCustomerMatchIndex({
      adminSupabase: input.adminSupabase,
      dealershipId: input.dealershipId,
    }));

  const matchedCustomerId = resolveCustomerIdFromIndex({
    authorFacebookId: input.authorFacebookId,
    authorName: input.authorName,
    matchIndex,
  });

  if (matchedCustomerId && input.authorFacebookId?.trim()) {
    await backfillCustomerFbId({
      adminSupabase: input.adminSupabase,
      authorFacebookId: input.authorFacebookId.trim(),
      customerId: matchedCustomerId,
    });
  }

  if (matchedCustomerId) {
    return matchedCustomerId;
  }

  if (!input.authorFacebookId?.trim()) {
    return null;
  }

  const { data: priorComment } = await input.adminSupabase
    .from("facebook_post_comments")
    .select("customer_id")
    .eq("dealership_id", input.dealershipId)
    .eq("author_facebook_id", input.authorFacebookId.trim())
    .not("customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ customer_id: string | null }>();

  return priorComment?.customer_id ?? null;
}
