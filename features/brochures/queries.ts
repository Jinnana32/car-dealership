import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessContext } from "@/lib/auth/types";
import type { VehicleMedia } from "@/features/vehicles/types";
import type { Vehicle } from "@/features/vehicles/types";
import type {
  BrochureExport,
  BrochureExportListResult,
  BrochureExportRecord,
  BrochureGeneratorData,
  BrochureVehicleItem,
  VehicleBrochureSummary,
} from "@/features/brochures/types";
import { brochureExportQuerySchema } from "@/features/brochures/validators";

type BrochureExportSearchParams = {
  exportType?: string | string[];
  status?: string | string[];
};

type BrochureVehicleSummaryRecord = Pick<
  Vehicle,
  "availability" | "id" | "slug" | "status" | "title"
>;

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function getSignedVehicleMedia(
  media: VehicleMedia[],
): Promise<Map<string, string | null>> {
  const supabase = await createSupabaseServerClient();
  const paths = media
    .map((item) => item.storage_path)
    .filter((item): item is string => Boolean(item));

  if (paths.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase.storage
    .from("vehicle-media")
    .createSignedUrls(paths, 60 * 60);

  if (error) {
    return new Map();
  }

  return new Map(
    data
      .filter((item): item is typeof item & { path: string } => Boolean(item.path))
      .map((item) => [item.path, item.signedUrl ?? null]),
  );
}

async function mapBrochureExportRelations(
  access: AdminAccessContext,
  rows: BrochureExport[],
): Promise<BrochureExportRecord[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const generatorIds = Array.from(
    new Set(
      rows
        .map((row) => row.generated_by)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const vehicleIds = Array.from(
    new Set(rows.flatMap((row) => row.vehicle_ids)),
  );

  const [profilesResponse, vehiclesResponse] = await Promise.all([
    generatorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", generatorIds)
      : Promise.resolve({
          data: [] as Array<{
            email: string | null;
            full_name: string | null;
            id: string;
          }>,
        }),
    vehicleIds.length > 0
      ? supabase
          .from("vehicles")
          .select("id, title, slug, status, availability")
          .eq("dealership_id", access.dealership.id)
          .in("id", vehicleIds)
      : Promise.resolve({
          data: [] as BrochureVehicleSummaryRecord[],
        }),
  ]);

  const profilesById = new Map(
    (profilesResponse.data ?? []).map((profile) => [
      profile.id,
      profile.full_name?.trim() || profile.email || "Team member",
    ]),
  );
  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );

  return rows.map((row) => ({
    ...row,
    generatedByName: row.generated_by
      ? profilesById.get(row.generated_by) ?? "Team member"
      : null,
    vehicles: row.vehicle_ids
      .map((vehicleId) => vehiclesById.get(vehicleId))
      .filter((vehicle): vehicle is BrochureVehicleSummaryRecord => Boolean(vehicle)),
  }));
}

export function parseBrochureExportFilters(
  searchParams: BrochureExportSearchParams,
): BrochureExportListResult["filters"] {
  return brochureExportQuerySchema.parse({
    exportType: getScalarValue(searchParams.exportType),
    status: getScalarValue(searchParams.status),
  });
}

export async function getBrochureGeneratorData(
  access: AdminAccessContext,
): Promise<BrochureGeneratorData> {
  const supabase = await createSupabaseServerClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  const vehicleRows = (vehicles ?? []) as Vehicle[];
  const vehicleIds = vehicleRows.map((vehicle) => vehicle.id);

  if (vehicleIds.length === 0) {
    return {
      totalCount: 0,
      vehicles: [],
    };
  }

  const { data: featuredMedia } = await supabase
    .from("vehicle_media")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("is_featured", true)
    .in("vehicle_id", vehicleIds);
  const signedUrlsByPath = await getSignedVehicleMedia(featuredMedia ?? []);
  const featuredMediaByVehicleId = new Map(
    (featuredMedia ?? []).map((item) => [
      item.vehicle_id,
      {
        ...item,
        signedUrl: item.storage_path
          ? signedUrlsByPath.get(item.storage_path) ?? null
          : null,
      },
    ]),
  );

  return {
    totalCount: vehicleRows.length,
    vehicles: vehicleRows.map(
      (vehicle): BrochureVehicleItem => ({
        ...vehicle,
        featuredMedia: featuredMediaByVehicleId.get(vehicle.id) ?? null,
      }),
    ),
  };
}

export async function getBrochureExports(
  access: AdminAccessContext,
  searchParams: BrochureExportSearchParams,
): Promise<BrochureExportListResult> {
  const filters = parseBrochureExportFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("brochure_exports")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .order("created_at", { ascending: false });

  if (filters.exportType !== "all") {
    query = query.eq("export_type", filters.exportType);
  }

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data } = await query;
  const exports = await mapBrochureExportRelations(
    access,
    (data ?? []) as BrochureExport[],
  );

  return {
    exports,
    filters,
    totalCount: exports.length,
  };
}

export async function getVehicleBrochureExports(
  access: AdminAccessContext,
  vehicleId: string,
): Promise<VehicleBrochureSummary> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("brochure_exports")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .contains("vehicle_ids", [vehicleId])
    .order("created_at", { ascending: false })
    .limit(5);

  const exports = await mapBrochureExportRelations(
    access,
    (data ?? []) as BrochureExport[],
  );

  return {
    exports,
    totalCount: exports.length,
  };
}

export async function getBrochureExportForDownload(
  access: AdminAccessContext,
  brochureId: string,
): Promise<BrochureExportRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("brochure_exports")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", brochureId)
    .maybeSingle<BrochureExport>();

  if (!data) {
    return null;
  }

  const [record] = await mapBrochureExportRelations(access, [data]);

  return record ?? null;
}
