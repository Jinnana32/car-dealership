import "server-only";

import { cache } from "react";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PublicDealership,
  PublicHomePageData,
  PublicVehicle,
  PublicVehicleCardRecord,
  PublicVehicleDetailRecord,
  PublicVehicleListFilters,
  PublicVehicleListPageData,
  PublicVehicleMedia,
} from "@/features/public/types";
import { publicVehicleFiltersSchema } from "@/features/public/validators";

type PublicVehicleSearchParams = {
  brand?: string | string[];
  maxPrice?: string | string[];
  minPrice?: string | string[];
  model?: string | string[];
  search?: string | string[];
};

type RawPublicVehicleMedia = {
  alt_text: string | null;
  id: string;
  is_featured: boolean;
  sort_order: number;
  storage_path: string | null;
};

type SignedPath = {
  signedUrl: string | null;
  storagePath: string | null;
};

const PUBLIC_DEALERSHIP_SELECT =
  "id, name, slug, logo_url, contact_email, contact_phone, facebook_page_url";
const PUBLIC_VEHICLE_SELECT =
  "id, slug, title, brand, model, variant, year, price, mileage, fuel_type, transmission, body_type, color, description, status, availability, featured_image_url, updated_at, is_price_negotiable, financing_enabled, financing_down_payment, financing_down_payment_percent, financing_monthly_terms, financing_notes";

function getFirstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function getSignedPublicVehicleMedia(
  storagePaths: Array<string | null>,
): Promise<SignedPath[]> {
  const nonNullPaths = storagePaths.filter(
    (path): path is string => Boolean(path),
  );

  if (nonNullPaths.length === 0) {
    return storagePaths.map((storagePath) => ({
      signedUrl: null,
      storagePath,
    }));
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.storage
    .from("vehicle-media")
    .createSignedUrls(nonNullPaths, 60 * 60);

  if (error) {
    return storagePaths.map((storagePath) => ({
      signedUrl: null,
      storagePath,
    }));
  }

  const signedUrlByPath = new Map(
    data.map((item) => [item.path, item.signedUrl ?? null]),
  );

  return storagePaths.map((storagePath) => ({
    signedUrl: storagePath ? signedUrlByPath.get(storagePath) ?? null : null,
    storagePath,
  }));
}

async function getPublicVehicleMediaForVehicles(
  vehicleIds: string[],
): Promise<Map<string, PublicVehicleMedia[]>> {
  if (vehicleIds.length === 0) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vehicle_media")
    .select("id, vehicle_id, sort_order, is_featured, alt_text, storage_path")
    .in("vehicle_id", vehicleIds)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const mediaRows = (data ?? []) as Array<RawPublicVehicleMedia & { vehicle_id: string }>;
  const signedPaths = await getSignedPublicVehicleMedia(
    mediaRows.map((item) => item.storage_path),
  );

  const mediaByVehicleId = new Map<string, PublicVehicleMedia[]>();

  mediaRows.forEach((item, index) => {
    const current = mediaByVehicleId.get(item.vehicle_id) ?? [];
    current.push({
      altText: item.alt_text,
      id: item.id,
      isFeatured: item.is_featured,
      signedUrl: signedPaths[index]?.signedUrl ?? null,
      sortOrder: item.sort_order,
    });
    mediaByVehicleId.set(item.vehicle_id, current);
  });

  return mediaByVehicleId;
}

async function buildPublicVehicleCards(
  vehicles: PublicVehicle[],
): Promise<PublicVehicleCardRecord[]> {
  const mediaByVehicleId = await getPublicVehicleMediaForVehicles(
    vehicles.map((vehicle) => vehicle.id),
  );

  return vehicles.map((vehicle) => {
    const media = mediaByVehicleId.get(vehicle.id) ?? [];
    const featuredImage =
      media.find((item) => item.isFeatured)?.signedUrl ??
      media[0]?.signedUrl ??
      null;

    return {
      ...vehicle,
      featuredImage,
    };
  });
}

export const getPublicDealershipBySlug = cache(
  async (dealerSlug: string): Promise<PublicDealership | null> => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("dealerships")
      .select(PUBLIC_DEALERSHIP_SELECT)
      .eq("slug", dealerSlug)
      .maybeSingle<PublicDealership>();

    return data ?? null;
  },
);

export async function getPublicHomePageData(
  dealerSlug: string,
): Promise<PublicHomePageData | null> {
  const dealership = await getPublicDealershipBySlug(dealerSlug);

  if (!dealership) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vehicles")
    .select(PUBLIC_VEHICLE_SELECT)
    .eq("dealership_id", dealership.id)
    .eq("status", "published")
    .eq("availability", "available")
    .order("updated_at", { ascending: false })
    .limit(3);

  const vehicles = (data ?? []) as PublicVehicle[];

  return {
    dealership,
    featuredVehicles: await buildPublicVehicleCards(vehicles),
  };
}

export function parsePublicVehicleFilters(
  searchParams: PublicVehicleSearchParams,
): PublicVehicleListFilters {
  return publicVehicleFiltersSchema.parse({
    brand: getFirstParam(searchParams.brand),
    maxPrice: getFirstParam(searchParams.maxPrice),
    minPrice: getFirstParam(searchParams.minPrice),
    model: getFirstParam(searchParams.model),
    search: getFirstParam(searchParams.search),
  });
}

export async function getPublicVehicleListingPageData(
  dealerSlug: string,
  searchParams: PublicVehicleSearchParams,
): Promise<PublicVehicleListPageData | null> {
  const dealership = await getPublicDealershipBySlug(dealerSlug);

  if (!dealership) {
    return null;
  }

  const filters = parsePublicVehicleFilters(searchParams);
  const supabase = await createSupabaseServerClient();

  const { data: filterSourceVehicles } = await supabase
    .from("vehicles")
    .select("brand, model")
    .eq("dealership_id", dealership.id)
    .eq("status", "published")
    .eq("availability", "available")
    .order("brand", { ascending: true });

  let query = supabase
    .from("vehicles")
    .select(PUBLIC_VEHICLE_SELECT, { count: "exact" })
    .eq("dealership_id", dealership.id)
    .eq("status", "published")
    .eq("availability", "available")
    .order("updated_at", { ascending: false });

  if (filters.search) {
    const normalizedSearch = filters.search.replace(/[,()]/g, " ").trim();

    if (normalizedSearch) {
      query = query.or(
        [
          `title.ilike.%${normalizedSearch}%`,
          `brand.ilike.%${normalizedSearch}%`,
          `model.ilike.%${normalizedSearch}%`,
          `variant.ilike.%${normalizedSearch}%`,
        ].join(","),
      );
    }
  }

  if (filters.brand) {
    query = query.eq("brand", filters.brand);
  }

  if (filters.model) {
    query = query.eq("model", filters.model);
  }

  if (filters.minPrice !== null) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice !== null) {
    query = query.lte("price", filters.maxPrice);
  }

  const { count, data } = await query;
  const vehicles = await buildPublicVehicleCards((data ?? []) as PublicVehicle[]);

  const brandSet = new Set<string>();
  const modelSet = new Set<string>();

  (filterSourceVehicles ?? []).forEach((item) => {
    if (item.brand) {
      brandSet.add(item.brand);
    }

    if (item.model) {
      modelSet.add(item.model);
    }
  });

  return {
    availableBrands: Array.from(brandSet).sort((left, right) =>
      left.localeCompare(right),
    ),
    availableModels: Array.from(modelSet).sort((left, right) =>
      left.localeCompare(right),
    ),
    dealership,
    filters,
    totalCount: count ?? vehicles.length,
    vehicles,
  };
}

export const getPublicVehicleDetailData = cache(
  async (
    dealerSlug: string,
    vehicleSlug: string,
  ): Promise<PublicVehicleDetailRecord | null> => {
    const dealership = await getPublicDealershipBySlug(dealerSlug);

    if (!dealership) {
      return null;
    }

    const supabase = await createSupabaseServerClient();
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select(PUBLIC_VEHICLE_SELECT)
      .eq("dealership_id", dealership.id)
      .eq("slug", vehicleSlug)
      .eq("status", "published")
      .eq("availability", "available")
      .maybeSingle<PublicVehicle>();

    if (!vehicle) {
      return null;
    }

    const mediaByVehicleId = await getPublicVehicleMediaForVehicles([vehicle.id]);
    const media = mediaByVehicleId.get(vehicle.id) ?? [];

    return {
      dealership,
      media,
      vehicle,
    };
  },
);
