import "server-only";

import { z } from "zod";

import {
  buildMessengerRef,
  parseMessengerVehicleMarker,
} from "@/features/facebook/messenger-vehicle-markers";
import type { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

export type ResolvedMessengerVehicleContext = {
  vehicleId: string | null;
  vehicleRef: string | null;
  vehicleSlug: string | null;
};

export async function resolveMessengerVehicleContext(input: {
  adminSupabase: AdminSupabaseClient;
  dealershipId: string;
  messageText?: string | null;
  referralRef?: string | null;
}): Promise<ResolvedMessengerVehicleContext> {
  let vehicleIdentifier: string | null = null;
  let vehicleRef: string | null = input.referralRef?.trim() || null;

  if (input.referralRef?.startsWith("vehicle_")) {
    vehicleIdentifier = input.referralRef.slice("vehicle_".length).trim();
  } else {
    const marker = input.messageText
      ? parseMessengerVehicleMarker(input.messageText)
      : null;

    if (marker) {
      vehicleIdentifier = marker.vehicleSlug;
      vehicleRef = buildMessengerRef(marker.vehicleSlug);
    }
  }

  if (!vehicleIdentifier) {
    return {
      vehicleId: null,
      vehicleRef,
      vehicleSlug: null,
    };
  }

  const identifierIsUuid = z.string().uuid().safeParse(vehicleIdentifier).success;
  const query = input.adminSupabase
    .from("vehicles")
    .select("id, slug")
    .eq("dealership_id", input.dealershipId);
  const { data: vehicle } = await (identifierIsUuid
    ? query.eq("id", vehicleIdentifier)
    : query.eq("slug", vehicleIdentifier))
    .maybeSingle<{ id: string; slug: string }>();

  return {
    vehicleId: vehicle?.id ?? null,
    vehicleRef,
    vehicleSlug: vehicle?.slug ?? (identifierIsUuid ? null : vehicleIdentifier),
  };
}
