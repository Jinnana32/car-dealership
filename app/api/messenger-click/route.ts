import { NextResponse } from "next/server";

import { resolvePublicMessengerPageId } from "@/features/facebook/public-messenger-page";
import { messengerClickSchema } from "@/features/facebook/validators";
import {
  buildMessengerLink,
  buildPublicVehiclePath,
} from "@/features/facebook/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MESSENGER_CLICK_SOURCE_DETAIL =
  "Public vehicle detail page Messenger CTA";

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const parsed = messengerClickSchema.safeParse({
    dealerSlug: requestUrl.searchParams.get("dealerSlug") ?? "",
    vehicleSlug: requestUrl.searchParams.get("vehicleSlug") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const fallbackPath = buildPublicVehiclePath(
    parsed.data.dealerSlug,
    parsed.data.vehicleSlug,
  );
  const adminSupabase = createSupabaseAdminClient();

  const { data: dealership } = await adminSupabase
    .from("dealerships")
    .select("id, slug")
    .eq("slug", parsed.data.dealerSlug)
    .maybeSingle<{ id: string; slug: string }>();

  if (!dealership) {
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  const { data: vehicle } = await adminSupabase
    .from("vehicles")
    .select("id, slug, title")
    .eq("dealership_id", dealership.id)
    .eq("slug", parsed.data.vehicleSlug)
    .eq("status", "published")
    .eq("availability", "available")
    .maybeSingle<{ id: string; slug: string; title: string }>();

  if (!vehicle) {
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  const { data: connection } = await adminSupabase
    .from("facebook_connections")
    .select("page_id, status")
    .eq("dealership_id", dealership.id)
    .maybeSingle<{
      page_id: string | null;
      status: "not_connected" | "configured" | "connected" | "error";
    }>();

  const messengerPageId = resolvePublicMessengerPageId(connection);

  if (!messengerPageId) {
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  await adminSupabase.from("lead_source_events").insert({
    dealership_id: dealership.id,
    event_name: "messenger_cta_clicked",
    metadata: {
      dealerSlug: parsed.data.dealerSlug,
      page: "vehicle_detail",
      vehicleSlug: parsed.data.vehicleSlug,
    },
    source_detail: MESSENGER_CLICK_SOURCE_DETAIL,
    source_type: "facebook_messenger",
    vehicle_id: vehicle.id,
  });

  return NextResponse.redirect(
    buildMessengerLink({
      messengerPageIdentifier: messengerPageId,
      vehicleSlug: vehicle.slug,
      vehicleTitle: vehicle.title,
    }),
  );
}
