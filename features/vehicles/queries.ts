import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminAccessContext } from "@/lib/auth/types";
import { getAdminAccessContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Vehicle,
  VehicleListFilterOptions,
  VehicleListFilters,
  VehicleListItem,
  VehicleListResult,
  VehicleLookupResult,
  VehicleMedia,
  VehicleMediaWithSignedUrl,
} from "@/features/vehicles/types";
import { vehicleListFiltersSchema } from "@/features/vehicles/validators";
import { buildVehicleMediaProxyUrl } from "@/lib/vehicle-media";

type QueryFiltersInput = {
  availability?: string | string[];
  bodyType?: string | string[];
  brand?: string | string[];
  maxPrice?: string | string[];
  minPrice?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  search?: string | string[];
  sort?: string | string[];
  status?: string | string[];
};

function getFirstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function getSignedVehicleMedia(
  media: VehicleMedia[],
): Promise<VehicleMediaWithSignedUrl[]> {
  return media.map((item) => ({
    ...item,
    signedUrl: item.storage_path ? buildVehicleMediaProxyUrl(item.storage_path) : null,
  }));
}

export function parseVehicleListFilters(
  searchParams: QueryFiltersInput,
): VehicleListFilters {
  const parsed = vehicleListFiltersSchema.parse({
    availability: getFirstParam(searchParams.availability),
    bodyType: getFirstParam(searchParams.bodyType),
    brand: getFirstParam(searchParams.brand),
    maxPrice: getFirstParam(searchParams.maxPrice),
    minPrice: getFirstParam(searchParams.minPrice),
    page: getFirstParam(searchParams.page),
    pageSize: getFirstParam(searchParams.pageSize),
    search: getFirstParam(searchParams.search),
    sort: getFirstParam(searchParams.sort),
    status: getFirstParam(searchParams.status),
  });

  return parsed;
}

export async function getVehicleListFilterOptions(
  access: AdminAccessContext,
): Promise<VehicleListFilterOptions> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("brand, body_type")
    .eq("dealership_id", access.dealership.id);

  if (error || !data) {
    return {
      bodyTypes: [],
      brands: [],
    };
  }

  const brands = new Set<string>();
  const bodyTypes = new Set<string>();

  for (const vehicle of data) {
    if (vehicle.brand?.trim()) {
      brands.add(vehicle.brand.trim());
    }

    if (vehicle.body_type?.trim()) {
      bodyTypes.add(vehicle.body_type.trim());
    }
  }

  return {
    bodyTypes: [...bodyTypes].sort((left, right) => left.localeCompare(right)),
    brands: [...brands].sort((left, right) => left.localeCompare(right)),
  };
}

export async function getVehiclesList(
  access: AdminAccessContext,
  searchParams: QueryFiltersInput,
): Promise<VehicleListResult> {
  const filters = parseVehicleListFilters(searchParams);
  const filterOptions = await getVehicleListFilterOptions(access);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("vehicles")
    .select("*", { count: "exact" })
    .eq("dealership_id", access.dealership.id);

  if (filters.search) {
    const normalizedSearch = filters.search.replace(/[,()]/g, " ").trim();

    if (normalizedSearch) {
      query = query.or(
        [
          `title.ilike.%${normalizedSearch}%`,
          `brand.ilike.%${normalizedSearch}%`,
          `model.ilike.%${normalizedSearch}%`,
          `variant.ilike.%${normalizedSearch}%`,
          `stock_number.ilike.%${normalizedSearch}%`,
          `vin.ilike.%${normalizedSearch}%`,
        ].join(","),
      );
    }
  }

  if (filters.status === "active") {
    query = query.neq("status", "archived");
  } else if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.availability !== "all") {
    query = query.eq("availability", filters.availability);
  }

  if (filters.brand !== "all") {
    query = query.eq("brand", filters.brand);
  }

  if (filters.bodyType !== "all") {
    query = query.eq("body_type", filters.bodyType);
  }

  if (filters.minPrice !== null) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice !== null) {
    query = query.lte("price", filters.maxPrice);
  }

  switch (filters.sort) {
    case "mileage_asc":
      query = query.order("mileage", { ascending: true, nullsFirst: false });
      break;
    case "mileage_desc":
      query = query.order("mileage", { ascending: false, nullsFirst: false });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    case "title_asc":
      query = query.order("title", { ascending: true });
      break;
    case "updated_asc":
      query = query.order("updated_at", { ascending: true });
      break;
    case "updated_desc":
    default:
      query = query.order("updated_at", { ascending: false });
      break;
  }

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  const { count, data, error } = await query.range(from, to);

  if (error) {
    return {
      filterOptions,
      filters,
      pageCount: 0,
      totalCount: 0,
      vehicles: [],
    };
  }

  const vehicles = data ?? [];
  const totalCount = count ?? 0;
  const pageCount = totalCount === 0 ? 0 : Math.ceil(totalCount / filters.pageSize);
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);

  if (vehicleIds.length === 0) {
    return {
      filterOptions,
      filters,
      pageCount,
      totalCount,
      vehicles: [],
    };
  }

  const { data: featuredMedia } = await supabase
    .from("vehicle_media")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("is_featured", true)
    .in("vehicle_id", vehicleIds);

  const signedFeaturedMedia = await getSignedVehicleMedia(featuredMedia ?? []);

  const featuredMediaByVehicleId = new Map(
    signedFeaturedMedia.map((item) => [item.vehicle_id, item]),
  );

  return {
    filterOptions,
    filters,
    pageCount,
    totalCount,
    vehicles: vehicles.map(
      (vehicle): VehicleListItem => ({
        ...vehicle,
        featuredMedia: featuredMediaByVehicleId.get(vehicle.id) ?? null,
      }),
    ),
  };
}

export async function getVehicleById(
  access: AdminAccessContext,
  vehicleId: string,
): Promise<VehicleLookupResult> {
  const supabase = await createSupabaseServerClient();
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicleId)
    .maybeSingle<Vehicle>();

  if (error) {
    return { type: "not_found" };
  }

  if (!vehicle) {
    const adminSupabase = createSupabaseAdminClient();
    const { data: existingVehicle } = await adminSupabase
      .from("vehicles")
      .select("id, dealership_id")
      .eq("id", vehicleId)
      .maybeSingle<Pick<Vehicle, "dealership_id" | "id">>();

    if (existingVehicle && existingVehicle.dealership_id !== access.dealership.id) {
      return { type: "forbidden" };
    }

    return { type: "not_found" };
  }

  const { data: media } = await supabase
    .from("vehicle_media")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("vehicle_id", vehicle.id)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const signedMedia = await getSignedVehicleMedia(media ?? []);

  return {
    record: {
      media: signedMedia,
      vehicle,
    },
    type: "ok",
  };
}

export type VehicleDetailPageContext =
  | { type: "unauthenticated" }
  | { type: "forbidden" }
  | { type: "not_found" }
  | {
      access: AdminAccessContext;
      record: {
        media: VehicleMediaWithSignedUrl[];
        vehicle: Vehicle;
      };
      type: "ok";
    };

export async function getVehicleDetailPageContext(
  vehicleId: string,
): Promise<VehicleDetailPageContext> {
  const access = await getAdminAccessContext();

  if (!access) {
    return { type: "unauthenticated" };
  }

  const result = await getVehicleById(access, vehicleId);

  if (result.type === "forbidden") {
    return { type: "forbidden" };
  }

  if (result.type === "not_found") {
    return { type: "not_found" };
  }

  return {
    access,
    record: result.record,
    type: "ok",
  };
}
