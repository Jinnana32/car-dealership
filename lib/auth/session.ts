import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type { AdminAccessContext, Dealership, DealershipMembership, Profile } from "@/lib/auth/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildLoginRedirect(nextPath: string): never {
  const searchParams = new URLSearchParams({
    next: nextPath,
  });

  redirect(`/login?${searchParams.toString()}`);
}

export const getAuthenticatedUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export async function requireAuthenticatedUser(nextPath: string) {
  const user = await getAuthenticatedUser();

  if (!user) {
    buildLoginRedirect(nextPath);
  }

  return user;
}

export const getAdminAccessContext = cache(async (): Promise<AdminAccessContext | null> => {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, auth_user_id, avatar_url, created_at, email, full_name, updated_at")
    .eq("auth_user_id", user.id)
    .maybeSingle<Profile>();

  if (profileError || !profile) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("dealership_members")
    .select("id, created_at, dealership_id, profile_id, role")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<DealershipMembership>();

  if (membershipError || !membership) {
    return null;
  }

  const { data: dealership, error: dealershipError } = await supabase
    .from("dealerships")
    .select(
      "id, contact_email, contact_phone, created_at, default_financing_headline, default_post_location_tag, default_sale_inclusions, facebook_page_url, logo_url, name, slug, updated_at, vehicle_catalog",
    )
    .eq("id", membership.dealership_id)
    .maybeSingle<Dealership>();

  if (dealershipError || !dealership) {
    return null;
  }

  return {
    dealership,
    membership,
    profile,
    user: {
      email: user.email ?? profile.email,
      id: user.id,
    },
  };
});

export async function requireAdminAccessContext(
  nextPath: string,
): Promise<AdminAccessContext | null> {
  await requireAuthenticatedUser(nextPath);

  return getAdminAccessContext();
}

export function getUserDisplayName(context: AdminAccessContext): string {
  return context.profile.full_name?.trim() || context.user.email || "Authenticated user";
}

