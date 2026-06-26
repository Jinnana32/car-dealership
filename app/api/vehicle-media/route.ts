import { NextResponse } from "next/server";

import { getAdminAccessContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getVehicleMediaMimeType,
  isValidVehicleMediaStoragePath,
} from "@/lib/vehicle-media";

async function canAccessVehicleMediaPath(path: string): Promise<boolean> {
  const access = await getAdminAccessContext();

  if (access && path.startsWith(`${access.dealership.id}/`)) {
    return true;
  }

  const supabase = await createSupabaseServerClient();
  const { data: mediaRow } = await supabase
    .from("vehicle_media")
    .select("vehicle_id")
    .eq("storage_path", path)
    .maybeSingle<{ vehicle_id: string }>();

  if (!mediaRow) {
    return false;
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("status, availability")
    .eq("id", mediaRow.vehicle_id)
    .maybeSingle<{
      availability: string;
      status: string;
    }>();

  if (!vehicle) {
    return false;
  }

  return vehicle.status === "published" && vehicle.availability === "available";
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const path = requestUrl.searchParams.get("path")?.trim() ?? "";

  if (!isValidVehicleMediaStoragePath(path)) {
    return new Response("Invalid media path.", { status: 400 });
  }

  const allowed = await canAccessVehicleMediaPath(path);

  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase.storage.from("vehicle-media").download(path);

  if (error || !data) {
    return new Response("Media not found.", { status: 404 });
  }

  const bytes = await data.arrayBuffer();

  return new NextResponse(bytes, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": getVehicleMediaMimeType(path),
    },
    status: 200,
  });
}
