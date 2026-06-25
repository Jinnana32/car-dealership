"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Inquiry } from "@/features/inquiries/types";
import { recordVehicleSaleSchema } from "@/features/sales/validators";
import { canManageDealership, canRecordSales } from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import type { AdminAccessContext } from "@/lib/auth/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { Vehicle } from "@/features/vehicles/types";
import type { Customer } from "@/features/customers/types";
import type { VehicleSale, VehicleSaleInsert } from "@/features/sales/types";

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
    (!candidate.startsWith("/admin/inquiries") &&
      !candidate.startsWith("/admin/vehicles") &&
      !candidate.startsWith("/admin/pipeline") &&
      !candidate.startsWith("/admin/reports"))
  ) {
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

async function getAccessibleVehicle(
  access: AdminAccessContext,
  vehicleId: string,
): Promise<Vehicle | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("vehicles")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicleId)
    .maybeSingle<Vehicle>();

  return data ?? null;
}

async function getAccessibleInquiry(
  access: AdminAccessContext,
  inquiryId: string | null,
): Promise<Inquiry | null> {
  if (!inquiryId) {
    return null;
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("inquiries")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiryId)
    .maybeSingle<Inquiry>();

  return data ?? null;
}

async function getAccessibleCustomer(
  access: AdminAccessContext,
  customerId: string | null,
): Promise<Pick<Customer, "full_name" | "id"> | null> {
  if (!customerId) {
    return null;
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data } = await adminSupabase
    .from("customers")
    .select("id, full_name")
    .eq("dealership_id", access.dealership.id)
    .eq("id", customerId)
    .maybeSingle<Pick<Customer, "full_name" | "id">>();

  return data ?? null;
}

function canCreateSaleForContext(input: {
  access: AdminAccessContext;
  inquiry: Inquiry | null;
}): boolean {
  if (canManageDealership(input.access.membership.role)) {
    return true;
  }

  if (input.access.membership.role !== "sales_agent") {
    return false;
  }

  return input.inquiry?.assigned_to === input.access.profile.id;
}

function revalidateSalesSurfaces(input: {
  dealershipSlug: string;
  inquiryId: string | null;
  redirectPath: string;
  vehicleId: string;
  vehicleSlug: string;
}): void {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/reports/sales");
  revalidatePath("/admin/reports/inventory");
  revalidatePath("/admin/reports/inquiries");
  revalidatePath("/admin/reports/lead-sources");
  revalidatePath("/admin/reports/pipeline");
  revalidatePath(input.redirectPath);
  revalidatePath(`/admin/vehicles/${input.vehicleId}`);

  if (input.inquiryId) {
    revalidatePath(`/admin/inquiries/${input.inquiryId}`);
  }

  revalidatePath(`/${input.dealershipSlug}`);
  revalidatePath(`/${input.dealershipSlug}/vehicles`);
  revalidatePath(`/${input.dealershipSlug}/vehicles/${input.vehicleSlug}`);
}

export async function recordVehicleSale(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    "/admin/inquiries",
  );
  const access = await requireAdminAccessContext("/admin/inquiries");

  if (!access || !canRecordSales(access.membership.role)) {
    redirectWithMessage(redirectPath, "error", "You do not have permission to record a sale.");
  }

  const parsed = recordVehicleSaleSchema.safeParse({
    asking_price: formData.get("asking_price"),
    confirm: formData.get("confirm"),
    customer_id: formData.get("customer_id"),
    inquiry_id: formData.get("inquiry_id"),
    notes: formData.get("notes"),
    payment_type: formData.get("payment_type"),
    redirect_to: formData.get("redirect_to"),
    sold_at: formData.get("sold_at"),
    sold_price: formData.get("sold_price"),
    vehicle_id: formData.get("vehicle_id"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      parsed.error.issues[0]?.message ?? "Enter valid sale details.",
    );
  }

  const [vehicle, inquiry] = await Promise.all([
    getAccessibleVehicle(access, parsed.data.vehicle_id),
    getAccessibleInquiry(access, parsed.data.inquiry_id),
  ]);

  if (!vehicle) {
    redirectWithMessage(redirectPath, "error", "Vehicle not found or not accessible.");
  }

  if (!canCreateSaleForContext({ access, inquiry })) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to record this sale.",
    );
  }

  if (vehicle.status === "sold" || vehicle.availability === "sold") {
    redirectWithMessage(
      redirectPath,
      "error",
      "This vehicle is already marked as sold.",
    );
  }

  if (inquiry && inquiry.status === "lost") {
    redirectWithMessage(
      redirectPath,
      "error",
      "A lost inquiry cannot be used to record a sale.",
    );
  }

  if (inquiry && inquiry.vehicle_id && inquiry.vehicle_id !== vehicle.id) {
    redirectWithMessage(
      redirectPath,
      "error",
      "The selected inquiry is linked to a different vehicle.",
    );
  }

  const fallbackCustomerId = inquiry?.customer_id ?? null;
  const selectedCustomerId = parsed.data.customer_id ?? fallbackCustomerId;

  if (
    inquiry &&
    parsed.data.customer_id &&
    parsed.data.customer_id !== inquiry.customer_id
  ) {
    redirectWithMessage(
      redirectPath,
      "error",
      "The selected customer does not match the selected inquiry.",
    );
  }

  const customer = await getAccessibleCustomer(access, selectedCustomerId);

  if (selectedCustomerId && !customer) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Customer not found or not accessible.",
    );
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: existingSale } = await adminSupabase
    .from("vehicle_sales")
    .select("id")
    .eq("dealership_id", access.dealership.id)
    .eq("vehicle_id", vehicle.id)
    .maybeSingle<Pick<VehicleSale, "id">>();

  if (existingSale) {
    redirectWithMessage(
      redirectPath,
      "error",
      "A sale record already exists for this vehicle.",
    );
  }

  const salePayload: VehicleSaleInsert = {
    asking_price: parsed.data.asking_price ?? vehicle.price,
    created_by: access.profile.id,
    customer_id: customer?.id ?? null,
    dealership_id: access.dealership.id,
    inquiry_id: inquiry?.id ?? null,
    notes: parsed.data.notes,
    payment_type: parsed.data.payment_type,
    sold_at: new Date(parsed.data.sold_at).toISOString(),
    sold_price: parsed.data.sold_price,
    vehicle_id: vehicle.id,
  };
  const { data: saleRecord, error: saleError } = await adminSupabase
    .from("vehicle_sales")
    .insert(salePayload)
    .select("*")
    .single<VehicleSale>();

  if (saleError || !saleRecord) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Unable to create the sale record right now.",
    );
  }

  const { error: vehicleError } = await adminSupabase
    .from("vehicles")
    .update({
      availability: "sold",
      status: "sold",
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", vehicle.id);

  if (vehicleError) {
    redirectWithMessage(
      redirectPath,
      "error",
      "The sale was recorded, but the vehicle status could not be updated.",
    );
  }

  if (inquiry) {
    const { error: inquiryError } = await adminSupabase
      .from("inquiries")
      .update({
        lost_reason: null,
        status: "won",
        vehicle_id: inquiry.vehicle_id ?? vehicle.id,
      })
      .eq("dealership_id", access.dealership.id)
      .eq("id", inquiry.id);

    if (inquiryError) {
      redirectWithMessage(
        redirectPath,
        "error",
        "The sale was recorded, but the inquiry could not be closed as won.",
      );
    }

    await adminSupabase.from("inquiry_events").insert({
      created_by: access.profile.id,
      dealership_id: access.dealership.id,
      event_type: "marked_won",
      inquiry_id: inquiry.id,
      metadata: {
        sale_id: saleRecord.id,
        sold_price: String(saleRecord.sold_price),
        vehicle_id: vehicle.id,
      } satisfies Json,
      new_status: "won",
      note: "Inquiry marked as won and sale recorded.",
      old_status: inquiry.status,
    });
  }

  revalidateSalesSurfaces({
    dealershipSlug: access.dealership.slug,
    inquiryId: inquiry?.id ?? null,
    redirectPath,
    vehicleId: vehicle.id,
    vehicleSlug: vehicle.slug,
  });
  redirectWithMessage(redirectPath, "success", "Sale recorded successfully.");
}
