"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";

import { renderBrochurePdf } from "@/features/brochures/pdf";
import type {
  BrochureExport,
  BrochureExportInsert,
  BrochureExportType,
  PreparedBrochureDealership,
  PreparedBrochureDocument,
  PreparedBrochureVehicle,
} from "@/features/brochures/types";
import {
  buildBrochureDefaultTitle,
  buildBrochurePublicVehicleUrl,
  buildBrochureStorageObjectUrl,
  buildBrochureStoragePath,
} from "@/features/brochures/utils";
import {
  parseBrochureFormBooleans,
  singleVehicleBrochureSchema,
  multiVehicleBrochureSchema,
} from "@/features/brochures/validators";
import { BROCHURE_STORAGE_BUCKET } from "@/features/brochures/constants";
import { canGenerateBrochures } from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import type { AdminAccessContext } from "@/lib/auth/types";
import { redirectWithMessage } from "@/lib/redirect";
import {
  getBrandLogoDataUrl,
  readLocalPublicImageAsDataUrl,
} from "@/lib/branding";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { Vehicle, VehicleMedia } from "@/features/vehicles/types";

type VehicleWithFeaturedMedia = Vehicle & {
  featuredMediaUrl: string | null;
};

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function sanitizeRedirectPath(
  candidate: string | undefined,
  fallback: string,
): string {
  if (
    !candidate ||
    (!candidate.startsWith("/admin/brochures") &&
      !candidate.startsWith("/admin/vehicles"))
  ) {
    return fallback;
  }

  return candidate;
}

function getVehicleIds(formData: FormData): string[] {
  const many = formData
    .getAll("vehicle_ids")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const single = getStringValue(formData, "vehicle_id").trim();
  const ids = single ? [single, ...many] : many;

  return Array.from(new Set(ids));
}

function buildBrochureSuccessMessage(input: {
  hadPublicUrlWarning: boolean;
  hadQrWarning: boolean;
}): string {
  if (input.hadPublicUrlWarning && input.hadQrWarning) {
    return "Brochure generated. Public links and QR codes were omitted for one or more vehicles.";
  }

  if (input.hadPublicUrlWarning) {
    return "Brochure generated. Public vehicle links were omitted for one or more vehicles.";
  }

  if (input.hadQrWarning) {
    return "Brochure generated. QR codes were omitted for one or more vehicles.";
  }

  return "Brochure generated successfully.";
}

async function fetchImageAsDataUrl(url: string | null): Promise<string | null> {
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await response.arrayBuffer());

    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function resolveDealershipLogoDataUrl(
  logoUrl: string | null,
): Promise<string | null> {
  const trimmed = logoUrl?.trim();

  if (trimmed) {
    if (trimmed.startsWith("/")) {
      const localLogo = await readLocalPublicImageAsDataUrl(trimmed);

      if (localLogo) {
        return localLogo;
      }
    }

    const remoteLogo = await fetchImageAsDataUrl(trimmed);

    if (remoteLogo) {
      return remoteLogo;
    }
  }

  return getBrandLogoDataUrl();
}

async function buildPreparedDealership(
  access: AdminAccessContext,
): Promise<PreparedBrochureDealership> {
  return {
    contactEmail: access.dealership.contact_email,
    contactPhone: access.dealership.contact_phone,
    facebookPageUrl: access.dealership.facebook_page_url,
    logoDataUrl: await resolveDealershipLogoDataUrl(access.dealership.logo_url),
    logoUrl: access.dealership.logo_url,
    name: access.dealership.name,
    slug: access.dealership.slug,
  };
}

async function getBrochureVehicles(input: {
  access: AdminAccessContext;
  vehicleIds: string[];
}): Promise<VehicleWithFeaturedMedia[]> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: vehicles } = await adminSupabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", input.access.dealership.id)
    .in("id", input.vehicleIds)
    .order("updated_at", { ascending: false });

  const vehicleRows = (vehicles ?? []) as Vehicle[];

  if (vehicleRows.length !== input.vehicleIds.length) {
    throw new Error("One or more vehicles were not found.");
  }

  const { data: media } = await adminSupabase
    .from("vehicle_media")
    .select("*")
    .eq("dealership_id", input.access.dealership.id)
    .in("vehicle_id", input.vehicleIds)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const featuredMediaByVehicleId = new Map<string, VehicleMedia>();
  const featuredMedia = (media ?? []) as VehicleMedia[];

  for (const item of featuredMedia) {
    if (!featuredMediaByVehicleId.has(item.vehicle_id)) {
      featuredMediaByVehicleId.set(item.vehicle_id, item);
    }
  }

  const storagePaths = Array.from(
    new Set(
      featuredMedia
        .map((item) => item.storage_path)
        .filter((path): path is string => Boolean(path)),
    ),
  );
  const signedUrlByPath =
    storagePaths.length > 0
      ? new Map(
          (
            await adminSupabase.storage
              .from("vehicle-media")
              .createSignedUrls(storagePaths, 60 * 60)
          ).data?.map((item) => [item.path, item.signedUrl ?? null]) ?? [],
        )
      : new Map<string, string | null>();

  return vehicleRows.map((vehicle) => ({
    ...vehicle,
    featuredMediaUrl: (() => {
      const featuredMedia = featuredMediaByVehicleId.get(vehicle.id);

      if (!featuredMedia) {
        return null;
      }

      if (featuredMedia.storage_path) {
        return signedUrlByPath.get(featuredMedia.storage_path) ?? null;
      }

      return featuredMedia.url;
    })(),
  }));
}

async function createPendingBrochureExport(input: {
  access: AdminAccessContext;
  exportType: BrochureExportType;
  title: string;
  vehicleIds: string[];
}): Promise<BrochureExport> {
  const adminSupabase = createSupabaseAdminClient();
  const payload: BrochureExportInsert = {
    dealership_id: input.access.dealership.id,
    export_type: input.exportType,
    generated_by: input.access.profile.id,
    metadata: {
      pending: true,
    } satisfies Json,
    status: "pending",
    title: input.title,
    vehicle_ids: input.vehicleIds,
  };
  const { data, error } = await adminSupabase
    .from("brochure_exports")
    .insert(payload)
    .select("*")
    .single<BrochureExport>();

  if (error || !data) {
    throw new Error("Unable to create brochure export.");
  }

  return data;
}

async function updateBrochureExport(input: {
  brochureId: string;
  values: Partial<BrochureExport>;
}): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase
    .from("brochure_exports")
    .update(input.values)
    .eq("id", input.brochureId);

  if (error) {
    throw new Error("Unable to update brochure export.");
  }
}

async function buildPreparedVehicles(input: {
  dealershipSlug: string;
  includeQrCode: boolean;
  siteUrl: string | null;
  vehicles: VehicleWithFeaturedMedia[];
}): Promise<{
  hadPublicUrlWarning: boolean;
  hadQrWarning: boolean;
  vehicles: PreparedBrochureVehicle[];
}> {
  let hadPublicUrlWarning = false;
  let hadQrWarning = false;

  const vehicles = await Promise.all(
    input.vehicles.map(async (vehicle) => {
      const publicUrl = buildBrochurePublicVehicleUrl({
        dealerSlug: input.dealershipSlug,
        siteUrl: input.siteUrl,
        vehicleAvailability: vehicle.availability,
        vehicleSlug: vehicle.slug,
        vehicleStatus: vehicle.status,
      });
      const featuredImageDataUrl = await fetchImageAsDataUrl(vehicle.featuredMediaUrl);

      if (!publicUrl) {
        hadPublicUrlWarning = true;
      }

      let qrCodeDataUrl: string | null = null;

      if (input.includeQrCode && publicUrl) {
        try {
          qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
            margin: 1,
            width: 160,
          });
        } catch {
          hadQrWarning = true;
        }
      }

      return {
        bodyType: vehicle.body_type,
        brand: vehicle.brand,
        color: vehicle.color,
        description: vehicle.description,
        featuredImageDataUrl,
        fuelType: vehicle.fuel_type,
        mileage: vehicle.mileage,
        model: vehicle.model,
        price: vehicle.price,
        publicUrl,
        qrCodeDataUrl,
        slug: vehicle.slug,
        title: vehicle.title,
        transmission: vehicle.transmission,
        variant: vehicle.variant,
        year: vehicle.year,
      } satisfies PreparedBrochureVehicle;
    }),
  );

  return {
    hadPublicUrlWarning,
    hadQrWarning,
    vehicles,
  };
}

function revalidateBrochureRoutes(input: {
  redirectPath: string;
  vehicleIds: string[];
}): void {
  revalidatePath("/admin/brochures");
  revalidatePath("/admin/brochures/new");
  revalidatePath(input.redirectPath);

  for (const vehicleId of input.vehicleIds) {
    revalidatePath(`/admin/vehicles/${vehicleId}`);
  }
}

async function runBrochureGeneration(input: {
  exportType: BrochureExportType;
  formData: FormData;
}): Promise<void> {
  const fallbackPath =
    input.exportType === "single_vehicle" ? "/admin/vehicles" : "/admin/brochures/new";
  const access = await requireAdminAccessContext("/admin/brochures");
  const redirectPath = sanitizeRedirectPath(
    getStringValue(input.formData, "redirect_to") || undefined,
    fallbackPath,
  );

  if (!access || !canGenerateBrochures(access.membership.role)) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to generate brochures.",
    );
  }

  const rawValues = {
    export_type: input.exportType,
    redirect_to: redirectPath,
    title: getStringValue(input.formData, "title"),
    vehicle_ids: getVehicleIds(input.formData),
    ...parseBrochureFormBooleans({
      include_contact_details: getStringValue(
        input.formData,
        "include_contact_details",
      ),
      include_disclaimer: getStringValue(input.formData, "include_disclaimer"),
      include_price: getStringValue(input.formData, "include_price"),
      include_qr_code: getStringValue(input.formData, "include_qr_code"),
    }),
  };

  const parsed =
    input.exportType === "single_vehicle"
      ? singleVehicleBrochureSchema.safeParse(rawValues)
      : multiVehicleBrochureSchema.safeParse(rawValues);

  if (!parsed.success) {
    const firstMessage =
      Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean) || "Please select valid vehicles for this brochure.";
    redirectWithMessage(redirectPath, "error", firstMessage);
  }

  const brochureVehicles = await getBrochureVehicles({
    access,
    vehicleIds: parsed.data.vehicle_ids,
  });
  const title =
    parsed.data.title ||
    buildBrochureDefaultTitle({
      dealershipName: access.dealership.name,
      exportType: parsed.data.export_type,
      firstVehicleTitle: brochureVehicles[0]?.title ?? null,
      vehicleCount: brochureVehicles.length,
    });

  let brochureExport: BrochureExport | null = null;
  let successMessage: string | null = null;

  try {
    brochureExport = await createPendingBrochureExport({
      access,
      exportType: parsed.data.export_type,
      title,
      vehicleIds: parsed.data.vehicle_ids,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;
    const preparedDealership = await buildPreparedDealership(access);
    const preparedVehicles = await buildPreparedVehicles({
      dealershipSlug: access.dealership.slug,
      includeQrCode: parsed.data.include_qr_code,
      siteUrl,
      vehicles: brochureVehicles,
    });
    const generatedAt = new Intl.DateTimeFormat("en-PH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
    const document: PreparedBrochureDocument = {
      dealership: preparedDealership,
      exportType: parsed.data.export_type,
      generatedAt,
      includeContactDetails: parsed.data.include_contact_details,
      includeDisclaimer: parsed.data.include_disclaimer,
      includePrice: parsed.data.include_price,
      includeQrCode: parsed.data.include_qr_code,
      title,
      vehicles: preparedVehicles.vehicles,
    };
    const renderedPdf = await renderBrochurePdf(document);
    const brochureBuffer = Buffer.isBuffer(renderedPdf)
      ? renderedPdf
      : Buffer.from(renderedPdf);
    const storagePath = buildBrochureStoragePath({
      brochureId: brochureExport.id,
      dealershipId: access.dealership.id,
      title,
    });
    const adminSupabase = createSupabaseAdminClient();
    const { error: uploadError } = await adminSupabase.storage
      .from(BROCHURE_STORAGE_BUCKET)
      .upload(storagePath, brochureBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error("Unable to upload the generated brochure.");
    }

    await updateBrochureExport({
      brochureId: brochureExport.id,
      values: {
        error_message: null,
        file_url: buildBrochureStorageObjectUrl(storagePath),
        generated_at: new Date().toISOString(),
        metadata: {
          include_contact_details: parsed.data.include_contact_details,
          include_disclaimer: parsed.data.include_disclaimer,
          include_price: parsed.data.include_price,
          include_qr_code: parsed.data.include_qr_code,
          public_url_warnings: preparedVehicles.hadPublicUrlWarning,
          qr_warnings: preparedVehicles.hadQrWarning,
          vehicle_count: preparedVehicles.vehicles.length,
        } satisfies Json,
        status: "generated",
        storage_path: storagePath,
        title,
      },
    });
    successMessage = buildBrochureSuccessMessage({
      hadPublicUrlWarning: preparedVehicles.hadPublicUrlWarning,
      hadQrWarning: preparedVehicles.hadQrWarning,
    });
  } catch (error) {
    if (brochureExport) {
      try {
        await updateBrochureExport({
          brochureId: brochureExport.id,
          values: {
            error_message:
              error instanceof Error
                ? error.message
                : "Unable to generate the brochure right now.",
            generated_at: new Date().toISOString(),
            metadata: {
              failed: true,
            } satisfies Json,
            status: "failed",
          },
        });
      } catch {
        // Preserve the original brochure failure and still return a clean admin error.
      }
    }

    redirectWithMessage(
      redirectPath,
      "error",
      error instanceof Error
        ? error.message
        : "Unable to generate the brochure right now.",
    );
  }

  revalidateBrochureRoutes({
    redirectPath,
    vehicleIds: parsed.data.vehicle_ids,
  });

  if (successMessage) {
    redirectWithMessage("/admin/brochures", "success", successMessage);
  }
}

export async function generateSingleVehicleBrochure(
  formData: FormData,
): Promise<void> {
  return runBrochureGeneration({
    exportType: "single_vehicle",
    formData,
  });
}

export async function generateMultiVehicleBrochure(
  formData: FormData,
): Promise<void> {
  return runBrochureGeneration({
    exportType: "multi_vehicle",
    formData,
  });
}
