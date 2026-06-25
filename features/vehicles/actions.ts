"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { canManageVehicles } from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import type { AdminAccessContext } from "@/lib/auth/types";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildFinancingTermsFromSelection,
  computeDownPaymentFromPercent,
  type VehicleFinancingTerm,
} from "@/features/vehicles/pricing";
import {
  VEHICLE_MEDIA_BUCKET,
} from "@/features/vehicles/constants";
import type {
  Vehicle,
  VehicleFormState,
  VehicleFormValues,
  VehicleInsert,
  VehicleMediaInsert,
} from "@/features/vehicles/types";
import {
  archiveVehicleSchema,
  createVehicleSchema,
  setFeaturedVehicleMediaSchema,
  updateVehicleSchema,
  uploadVehicleMediaSchema,
  vehicleAvailabilitySchema,
  vehicleStatusSchema,
} from "@/features/vehicles/validators";
import {
  buildVehiclePhotoAltText,
  buildVehicleSlugCandidate,
  buildVehicleStorageObjectUrl,
  buildVehicleStoragePath,
  slugifyVehicleValue,
} from "@/features/vehicles/utils";

type AppSupabaseClient = SupabaseClient<Database>;

const initialVehicleFormState: VehicleFormState = {
  error: undefined,
  fieldErrors: {},
};

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getFiles(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function sanitizeVehicleRedirectPath(
  candidate: string | undefined,
  fallback: string,
): string {
  if (!candidate || !candidate.startsWith("/admin/vehicles")) {
    return fallback;
  }

  return candidate;
}

function redirectWithMessage(
  pathname: string,
  key: "error" | "success",
  message: string,
): never {
  const searchParams = new URLSearchParams({
    [key]: message,
  });

  redirect(`${pathname}?${searchParams.toString()}`);
}

function formatVehicleFormErrors(error: {
  flatten: () => {
    fieldErrors: Record<string, string[] | undefined>;
  };
}, values: VehicleFormValues): VehicleFormState {
  return {
    error: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
    values,
  };
}

function mapVehicleDatabaseError(
  errorMessage: string,
  values: VehicleFormValues,
): VehicleFormState {
  if (errorMessage.toLowerCase().includes("stock")) {
    return {
      error: "Stock number already exists for this dealership.",
      fieldErrors: {
        stock_number: ["Stock number already exists for this dealership."],
      },
      values,
    };
  }

  if (errorMessage.toLowerCase().includes("slug")) {
    return {
      error: "Slug already exists for this dealership.",
      fieldErrors: {
        slug: ["Slug already exists for this dealership."],
      },
      values,
    };
  }

  return {
    error: "Unable to save the vehicle right now.",
    fieldErrors: {},
    values,
  };
}

function getCheckboxFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return value === "true" || value === "on" ? "true" : "false";
}

function extractVehicleFormValues(formData: FormData): VehicleFormValues {
  return {
    availability: getStringValue(formData, "availability"),
    body_type: getStringValue(formData, "body_type"),
    brand: getStringValue(formData, "brand"),
    color: getStringValue(formData, "color"),
    condition_summary: getStringValue(formData, "condition_summary"),
    description: getStringValue(formData, "description"),
    engine: getStringValue(formData, "engine"),
    financing_display_style: getStringValue(formData, "financing_display_style") || "detailed",
    financing_down_payment_percent: getStringValue(formData, "financing_down_payment_percent"),
    financing_down_payment_label: getStringValue(formData, "financing_down_payment_label"),
    financing_enabled: getCheckboxFormValue(formData, "financing_enabled"),
    financing_headline: getStringValue(formData, "financing_headline"),
    financing_monthly_terms: getStringValue(formData, "financing_monthly_terms"),
    financing_notes: getStringValue(formData, "financing_notes"),
    fuel_type: getStringValue(formData, "fuel_type"),
    highlights: getStringValue(formData, "highlights"),
    is_price_negotiable: getCheckboxFormValue(formData, "is_price_negotiable"),
    mileage: getStringValue(formData, "mileage"),
    model: getStringValue(formData, "model"),
    plate_number: getStringValue(formData, "plate_number"),
    post_location_tag: getStringValue(formData, "post_location_tag"),
    price: getStringValue(formData, "price"),
    sale_inclusions: getStringValue(formData, "sale_inclusions"),
    show_cash_price_in_posts: getCheckboxFormValue(formData, "show_cash_price_in_posts"),
    slug: getStringValue(formData, "slug"),
    status: getStringValue(formData, "status"),
    stock_number: getStringValue(formData, "stock_number"),
    title: getStringValue(formData, "title"),
    transmission: getStringValue(formData, "transmission"),
    use_cases: getStringValue(formData, "use_cases"),
    variant: getStringValue(formData, "variant"),
    vin: getStringValue(formData, "vin"),
    year: getStringValue(formData, "year"),
  };
}

function extractFinancingTermYears(formData: FormData): number[] {
  return [...new Set(
    formData
      .getAll("financing_term_years")
      .map((value) => Number(value))
      .filter((year) => Number.isInteger(year) && year >= 1 && year <= 10),
  )].sort((left, right) => left - right);
}

function applyVehicleFinancingPayload<T extends z.infer<typeof createVehicleSchema>>(
  data: T,
  formData: FormData,
): T & {
  financing_down_payment: number | null;
  financing_down_payment_label: null;
  financing_down_payment_percent: number | null;
  financing_headline: null;
  financing_monthly_terms: VehicleFinancingTerm[];
  financing_notes: null;
} {
  const termYears = extractFinancingTermYears(formData);

  if (!data.financing_enabled) {
    return {
      ...data,
      financing_down_payment: null,
      financing_down_payment_percent: null,
      financing_down_payment_label: null,
      financing_headline: null,
      financing_monthly_terms: [],
      financing_notes: null,
    };
  }

  const downPayment = computeDownPaymentFromPercent(
    data.price,
    data.financing_down_payment_percent,
  );

  return {
    ...data,
    financing_down_payment: downPayment,
    financing_down_payment_percent: data.financing_down_payment_percent,
    financing_down_payment_label: null,
    financing_headline: null,
    financing_monthly_terms: buildFinancingTermsFromSelection({
      cashPrice: data.price,
      downPayment,
      selectedTermYears: termYears,
    }),
    financing_notes: null,
  };
}

function validateFinancingTermSelection(
  data: z.infer<typeof createVehicleSchema>,
  formData: FormData,
  values: VehicleFormValues,
): VehicleFormState | null {
  if (!data.financing_enabled) {
    return null;
  }

  const termYears = extractFinancingTermYears(formData);

  if (termYears.length === 0) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: {
        financing_monthly_terms: ["Select at least one financing term."],
      },
      values,
    };
  }

  if (data.price === null) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: {
        price: ["Enter a cash price to calculate financing terms."],
      },
      values,
    };
  }

  if (data.financing_down_payment_percent === null) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: {
        financing_down_payment_percent: ["Enter a down payment percentage."],
      },
      values,
    };
  }

  return null;
}

async function getVehicleManagerAccess(
  nextPath: string,
): Promise<AdminAccessContext | null> {
  const access = await requireAdminAccessContext(nextPath);

  if (!access || !canManageVehicles(access.membership.role)) {
    return null;
  }

  return access;
}

async function getManagedVehicleOrRedirect(input: {
  access: AdminAccessContext;
  fallbackPath: string;
  supabase: AppSupabaseClient;
  vehicleId: string;
}): Promise<Vehicle> {
  const { data: vehicle, error } = await input.supabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", input.access.dealership.id)
    .eq("id", input.vehicleId)
    .maybeSingle<Vehicle>();

  if (error || !vehicle) {
    redirectWithMessage(input.fallbackPath, "error", "Vehicle not found.");
  }

  return vehicle;
}

async function ensureUniqueVehicleSlug(input: {
  access: AdminAccessContext;
  requestedSlug: string | null;
  supabase: AppSupabaseClient;
  title: string;
  model: string;
  vehicleId?: string;
  year: number | null;
}): Promise<string> {
  const baseSlug =
    input.requestedSlug && input.requestedSlug.trim().length > 0
      ? slugifyVehicleValue(input.requestedSlug)
      : buildVehicleSlugCandidate({
          model: input.model,
          title: input.title,
          year: input.year,
        });

  let candidate = baseSlug;
  let sequence = 2;

  while (true) {
    let query = input.supabase
      .from("vehicles")
      .select("id")
      .eq("dealership_id", input.access.dealership.id)
      .eq("slug", candidate)
      .limit(1);

    if (input.vehicleId) {
      query = query.neq("id", input.vehicleId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return candidate;
    }

    candidate = `${baseSlug}-${sequence}`;
    sequence += 1;
  }
}

async function uploadVehicleMediaRecords(input: {
  access: AdminAccessContext;
  files: File[];
  supabase: AppSupabaseClient;
  vehicle: Vehicle;
}): Promise<{
  errorMessage?: string;
  uploadedCount: number;
}> {
  if (input.files.length === 0) {
    return { uploadedCount: 0 };
  }

  const filesValidation = uploadVehicleMediaSchema.safeParse({
    files: input.files,
    vehicle_id: input.vehicle.id,
  });

  if (!filesValidation.success) {
    return {
      errorMessage:
        filesValidation.error.issues[0]?.message ?? "Photo upload failed.",
      uploadedCount: 0,
    };
  }

  const { data: existingMedia, error: existingMediaError } = await input.supabase
    .from("vehicle_media")
    .select("id, is_featured, sort_order")
    .eq("vehicle_id", input.vehicle.id)
    .eq("dealership_id", input.access.dealership.id)
    .order("sort_order", { ascending: false });

  if (existingMediaError) {
    return {
      errorMessage: "Vehicle saved, but photos could not be uploaded.",
      uploadedCount: 0,
    };
  }

  const currentMaxSortOrder =
    existingMedia && existingMedia.length > 0 ? existingMedia[0]?.sort_order ?? 0 : -1;
  const hasFeaturedMedia =
    existingMedia?.some((item) => item.is_featured) ?? false;

  const uploadedPaths: string[] = [];
  const mediaRows: VehicleMediaInsert[] = [];

  for (const [index, file] of input.files.entries()) {
    const storagePath = buildVehicleStoragePath({
      dealershipId: input.access.dealership.id,
      fileName: file.name,
      vehicleId: input.vehicle.id,
    });

    const { error: uploadError } = await input.supabase.storage
      .from(VEHICLE_MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      continue;
    }

    uploadedPaths.push(storagePath);
    mediaRows.push({
      alt_text: buildVehiclePhotoAltText(input.vehicle.title, index + 1),
      dealership_id: input.access.dealership.id,
      is_featured: !hasFeaturedMedia && mediaRows.length === 0,
      sort_order: currentMaxSortOrder + index + 1,
      storage_path: storagePath,
      url: buildVehicleStorageObjectUrl(storagePath),
      vehicle_id: input.vehicle.id,
    });
  }

  if (mediaRows.length === 0) {
    return {
      errorMessage: "Vehicle saved, but no photos were uploaded.",
      uploadedCount: 0,
    };
  }

  const { data: insertedMedia, error: mediaInsertError } = await input.supabase
    .from("vehicle_media")
    .insert(mediaRows)
    .select("id, is_featured, url");

  if (mediaInsertError) {
    await input.supabase.storage.from(VEHICLE_MEDIA_BUCKET).remove(uploadedPaths);

    return {
      errorMessage: "Vehicle saved, but photos could not be linked.",
      uploadedCount: 0,
    };
  }

  const featuredMedia = insertedMedia?.find((item) => item.is_featured);

  if (featuredMedia) {
    await input.supabase
      .from("vehicles")
      .update({
        featured_image_url: featuredMedia.url,
      })
      .eq("id", input.vehicle.id)
      .eq("dealership_id", input.access.dealership.id);
  }

  return {
    uploadedCount: mediaRows.length,
  };
}

function revalidateVehiclePaths(vehicleId: string): void {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/vehicles/new");
  revalidatePath(`/admin/vehicles/${vehicleId}`);
  revalidatePath(`/admin/vehicles/${vehicleId}/edit`);
}

export async function createVehicle(
  _: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const access = await getVehicleManagerAccess("/admin/vehicles/new");
  const values = extractVehicleFormValues(formData);

  if (!access) {
    return {
      error: "You do not have permission to add vehicles.",
      fieldErrors: {},
      values,
    };
  }

  const parsed = createVehicleSchema.safeParse(values);

  if (!parsed.success) {
    return formatVehicleFormErrors(parsed.error, values);
  }

  const financingValidationError = validateFinancingTermSelection(
    parsed.data,
    formData,
    values,
  );

  if (financingValidationError) {
    return financingValidationError;
  }

  const mediaFiles = getFiles(formData, "media_files");
  const supabase = await createSupabaseServerClient();

  try {
    const slug = await ensureUniqueVehicleSlug({
      access,
      model: parsed.data.model,
      requestedSlug: parsed.data.slug,
      supabase,
      title: parsed.data.title,
      year: parsed.data.year,
    });

    const insertPayload: VehicleInsert = {
      ...applyVehicleFinancingPayload(parsed.data, formData),
      created_by: access.profile.id,
      dealership_id: access.dealership.id,
      featured_image_url: null,
      slug,
    };

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .insert(insertPayload)
      .select("*")
      .maybeSingle<Vehicle>();

    if (error || !vehicle) {
      return mapVehicleDatabaseError(
        error?.message ?? "Unable to create vehicle.",
        values,
      );
    }

    const uploadResult = await uploadVehicleMediaRecords({
      access,
      files: mediaFiles,
      supabase,
      vehicle,
    });

    revalidateVehiclePaths(vehicle.id);

    const successMessage = uploadResult.errorMessage
      ? "Vehicle created. Some photos could not be uploaded."
      : "Vehicle created.";

    redirectWithMessage(
      `/admin/vehicles/${vehicle.id}`,
      "success",
      successMessage,
    );
  } catch {
    return {
      ...initialVehicleFormState,
      error: "Unable to create the vehicle right now.",
      values,
    };
  }
}

export async function updateVehicle(
  vehicleId: string,
  _: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const access = await getVehicleManagerAccess(`/admin/vehicles/${vehicleId}/edit`);
  const values = extractVehicleFormValues(formData);

  if (!access) {
    return {
      error: "You do not have permission to edit vehicles.",
      fieldErrors: {},
      values,
    };
  }

  const parsed = updateVehicleSchema.safeParse(values);

  if (!parsed.success) {
    return formatVehicleFormErrors(parsed.error, values);
  }

  const financingValidationError = validateFinancingTermSelection(
    parsed.data,
    formData,
    values,
  );

  if (financingValidationError) {
    return financingValidationError;
  }

  const mediaFiles = getFiles(formData, "media_files");
  const supabase = await createSupabaseServerClient();

  try {
    const existingVehicle = await getManagedVehicleOrRedirect({
      access,
      fallbackPath: "/admin/vehicles",
      supabase,
      vehicleId,
    });

    const slug = await ensureUniqueVehicleSlug({
      access,
      model: parsed.data.model,
      requestedSlug: parsed.data.slug,
      supabase,
      title: parsed.data.title,
      vehicleId: existingVehicle.id,
      year: parsed.data.year,
    });

    const updatePayload = {
      ...applyVehicleFinancingPayload(parsed.data, formData),
      slug,
    };

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .update(updatePayload)
      .eq("dealership_id", access.dealership.id)
      .eq("id", existingVehicle.id)
      .select("*")
      .maybeSingle<Vehicle>();

    if (error || !vehicle) {
      return mapVehicleDatabaseError(
        error?.message ?? "Unable to update vehicle.",
        values,
      );
    }

    const uploadResult = await uploadVehicleMediaRecords({
      access,
      files: mediaFiles,
      supabase,
      vehicle,
    });

    revalidateVehiclePaths(vehicle.id);

    const successMessage = uploadResult.errorMessage
      ? "Vehicle updated. Some photos could not be uploaded."
      : "Vehicle updated.";

    redirectWithMessage(
      `/admin/vehicles/${vehicle.id}`,
      "success",
      successMessage,
    );
  } catch {
    return {
      ...initialVehicleFormState,
      error: "Unable to update the vehicle right now.",
      values,
    };
  }
}

export async function archiveVehicle(formData: FormData): Promise<void> {
  const parsed = archiveVehicleSchema.safeParse({
    redirect_to: getStringValue(formData, "redirect_to"),
    vehicle_id: getStringValue(formData, "vehicle_id"),
  });

  const fallbackPath = sanitizeVehicleRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? String(formData.get("redirect_to"))
      : undefined,
    "/admin/vehicles",
  );

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "Unable to archive vehicle.",
    );
  }

  const access = await getVehicleManagerAccess(`/admin/vehicles/${parsed.data.vehicle_id}`);

  if (!access) {
    redirectWithMessage(fallbackPath, "error", "You do not have permission to archive vehicles.");
  }

  const supabase = await createSupabaseServerClient();
  const vehicle = await getManagedVehicleOrRedirect({
    access,
    fallbackPath,
    supabase,
    vehicleId: parsed.data.vehicle_id,
  });

  const { error } = await supabase
    .from("vehicles")
    .update({
      availability: "unavailable",
      status: "archived",
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicle.id);

  if (error) {
    redirectWithMessage(fallbackPath, "error", "Unable to archive vehicle.");
  }

  revalidateVehiclePaths(vehicle.id);
  redirectWithMessage("/admin/vehicles", "success", "Vehicle archived.");
}

export async function uploadVehicleMedia(formData: FormData): Promise<void> {
  const parsed = uploadVehicleMediaSchema.safeParse({
    alt_text: getStringValue(formData, "alt_text") || undefined,
    files: getFiles(formData, "media_files"),
    redirect_to: getStringValue(formData, "redirect_to") || undefined,
    vehicle_id: getStringValue(formData, "vehicle_id"),
  });

  const fallbackPath = sanitizeVehicleRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? String(formData.get("redirect_to"))
      : undefined,
    "/admin/vehicles",
  );

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "Unable to upload photos.",
    );
  }

  const access = await getVehicleManagerAccess(
    `/admin/vehicles/${parsed.data.vehicle_id}/edit`,
  );

  if (!access) {
    redirectWithMessage(fallbackPath, "error", "You do not have permission to upload photos.");
  }

  const supabase = await createSupabaseServerClient();
  const vehicle = await getManagedVehicleOrRedirect({
    access,
    fallbackPath,
    supabase,
    vehicleId: parsed.data.vehicle_id,
  });

  const uploadResult = await uploadVehicleMediaRecords({
    access,
    files: parsed.data.files,
    supabase,
    vehicle,
  });

  revalidateVehiclePaths(vehicle.id);

  if (uploadResult.errorMessage) {
    redirectWithMessage(fallbackPath, "error", uploadResult.errorMessage);
  }

  redirectWithMessage(
    fallbackPath,
    "success",
    uploadResult.uploadedCount === 1
      ? "Photo uploaded."
      : "Photos uploaded.",
  );
}

export async function setFeaturedVehicleMedia(formData: FormData): Promise<void> {
  const parsed = setFeaturedVehicleMediaSchema.safeParse({
    media_id: getStringValue(formData, "media_id"),
    redirect_to: getStringValue(formData, "redirect_to") || undefined,
    vehicle_id: getStringValue(formData, "vehicle_id"),
  });

  const fallbackPath = sanitizeVehicleRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? String(formData.get("redirect_to"))
      : undefined,
    "/admin/vehicles",
  );

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "Unable to update featured photo.",
    );
  }

  const access = await getVehicleManagerAccess(
    `/admin/vehicles/${parsed.data.vehicle_id}/edit`,
  );

  if (!access) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "You do not have permission to manage vehicle photos.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const vehicle = await getManagedVehicleOrRedirect({
    access,
    fallbackPath,
    supabase,
    vehicleId: parsed.data.vehicle_id,
  });

  const { data: targetMedia, error: targetMediaError } = await supabase
    .from("vehicle_media")
    .select("id, url")
    .eq("dealership_id", access.dealership.id)
    .eq("vehicle_id", vehicle.id)
    .eq("id", parsed.data.media_id)
    .maybeSingle<{ id: string; url: string }>();

  if (targetMediaError || !targetMedia) {
    redirectWithMessage(fallbackPath, "error", "Photo not found.");
  }

  const { error: resetError } = await supabase
    .from("vehicle_media")
    .update({
      is_featured: false,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("vehicle_id", vehicle.id);

  if (resetError) {
    redirectWithMessage(fallbackPath, "error", "Unable to update featured photo.");
  }

  const { error: featuredError } = await supabase
    .from("vehicle_media")
    .update({
      is_featured: true,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("vehicle_id", vehicle.id)
    .eq("id", targetMedia.id);

  if (featuredError) {
    redirectWithMessage(fallbackPath, "error", "Unable to update featured photo.");
  }

  await supabase
    .from("vehicles")
    .update({
      featured_image_url: targetMedia.url,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicle.id);

  revalidateVehiclePaths(vehicle.id);
  redirectWithMessage(fallbackPath, "success", "Featured photo updated.");
}

export async function updateVehicleStatus(formData: FormData): Promise<void> {
  const parsed = vehicleStatusSchema.safeParse({
    redirect_to: getStringValue(formData, "redirect_to") || undefined,
    status: getStringValue(formData, "status"),
    vehicle_id: getStringValue(formData, "vehicle_id"),
  });

  const fallbackPath = sanitizeVehicleRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? String(formData.get("redirect_to"))
      : undefined,
    "/admin/vehicles",
  );

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "Unable to update vehicle status.",
    );
  }

  const access = await getVehicleManagerAccess(
    `/admin/vehicles/${parsed.data.vehicle_id}`,
  );

  if (!access) {
    redirectWithMessage(fallbackPath, "error", "You do not have permission to update vehicle status.");
  }

  const supabase = await createSupabaseServerClient();
  const vehicle = await getManagedVehicleOrRedirect({
    access,
    fallbackPath,
    supabase,
    vehicleId: parsed.data.vehicle_id,
  });

  const { error } = await supabase
    .from("vehicles")
    .update({
      status: parsed.data.status,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicle.id);

  if (error) {
    redirectWithMessage(fallbackPath, "error", "Unable to update vehicle status.");
  }

  revalidateVehiclePaths(vehicle.id);
  redirectWithMessage(fallbackPath, "success", "Vehicle status updated.");
}

export async function updateVehicleAvailability(formData: FormData): Promise<void> {
  const parsed = vehicleAvailabilitySchema.safeParse({
    availability: getStringValue(formData, "availability"),
    redirect_to: getStringValue(formData, "redirect_to") || undefined,
    vehicle_id: getStringValue(formData, "vehicle_id"),
  });

  const fallbackPath = sanitizeVehicleRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? String(formData.get("redirect_to"))
      : undefined,
    "/admin/vehicles",
  );

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "Unable to update vehicle availability.",
    );
  }

  const access = await getVehicleManagerAccess(
    `/admin/vehicles/${parsed.data.vehicle_id}`,
  );

  if (!access) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "You do not have permission to update vehicle availability.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const vehicle = await getManagedVehicleOrRedirect({
    access,
    fallbackPath,
    supabase,
    vehicleId: parsed.data.vehicle_id,
  });

  const { error } = await supabase
    .from("vehicles")
    .update({
      availability: parsed.data.availability,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicle.id);

  if (error) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "Unable to update vehicle availability.",
    );
  }

  revalidateVehiclePaths(vehicle.id);
  redirectWithMessage(fallbackPath, "success", "Vehicle availability updated.");
}
