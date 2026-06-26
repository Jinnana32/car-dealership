"use server";

import { revalidatePath } from "next/cache";

import type { ZodError } from "zod";

import { canCreateLeads } from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import { redirectWithMessage } from "@/lib/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Customer, CustomerInsert } from "@/features/customers/types";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "@/features/customers/validators";
import { buildCustomerNameParts } from "@/features/inquiries/utils";

type ActionResult<T> = {
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};

function getValidationErrors(error: ZodError): {
  fieldErrors: Record<string, string[] | undefined>;
  formErrors: string[];
} {
  const flattened = error.flatten();
  const formErrors =
    flattened.formErrors.length > 0
      ? flattened.formErrors
      : Array.from(new Set(error.issues.map((issue) => issue.message)));

  return {
    fieldErrors: flattened.fieldErrors,
    formErrors,
  };
}

function sanitizeRedirectPath(
  candidate: string | undefined,
  fallback: string,
): string {
  if (
    !candidate ||
    (!candidate.startsWith("/admin/customers") &&
      !candidate.startsWith("/admin/inquiries"))
  ) {
    return fallback;
  }

  return candidate;
}

export async function createCustomer(input: {
  email: string | null;
  facebook_profile_url?: string | null;
  full_name: string;
  notes?: string | null;
  phone: string | null;
  source_type?: string | null;
}): Promise<ActionResult<{ customer: Customer }>> {
  const access = await requireAdminAccessContext("/admin/leads/new");

  if (!access || !canCreateLeads(access.membership.role)) {
    return {
      error: "You do not have permission to create customers.",
    };
  }

  const parsed = createCustomerSchema.safeParse(input);

  if (!parsed.success) {
    const validationErrors = getValidationErrors(parsed.error);

    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: validationErrors.fieldErrors,
      formErrors: validationErrors.formErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { firstName, lastName } = buildCustomerNameParts(parsed.data.full_name);
  const payload: CustomerInsert = {
    created_by: access.profile.id,
    dealership_id: access.dealership.id,
    email: parsed.data.email,
    facebook_profile_url: parsed.data.facebook_profile_url,
    first_name: firstName,
    full_name: parsed.data.full_name,
    last_name: lastName,
    notes: parsed.data.notes,
    phone: parsed.data.phone,
    source_type: parsed.data.source_type,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select("*")
    .single<Customer>();

  if (error || !data) {
    return {
      error: "Unable to create the customer right now.",
    };
  }

  revalidatePath("/admin/customers");

  return {
    data: {
      customer: data,
    },
  };
}

export async function updateCustomer(formData: FormData): Promise<void> {
  const access = await requireAdminAccessContext("/admin/customers");
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/customers",
  );

  if (!access || !canCreateLeads(access.membership.role)) {
    redirectWithMessage(redirectPath, "error", "You do not have permission to update customers.");
  }

  const parsed = updateCustomerSchema.safeParse({
    customer_id: formData.get("customer_id"),
    email: formData.get("email"),
    facebook_profile_url: formData.get("facebook_profile_url"),
    full_name: formData.get("full_name"),
    notes: formData.get("notes"),
    phone: formData.get("phone"),
    redirect_to: formData.get("redirect_to"),
    source_type: formData.get("source_type"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Please correct the customer details and try again.");
  }

  const supabase = await createSupabaseServerClient();
  const { firstName, lastName } = buildCustomerNameParts(parsed.data.full_name);
  const { data, error } = await supabase
    .from("customers")
    .update({
      email: parsed.data.email,
      facebook_profile_url: parsed.data.facebook_profile_url,
      first_name: firstName,
      full_name: parsed.data.full_name,
      last_name: lastName,
      notes: parsed.data.notes,
      phone: parsed.data.phone,
      source_type: parsed.data.source_type,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.customer_id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirectWithMessage(redirectPath, "error", "Unable to update this customer.");
  }

  revalidatePath("/admin/customers");
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Customer updated.");
}
