"use server";

import { revalidatePath } from "next/cache";

import {
  canCreateLeads,
  canManageFacebookSettings,
} from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import { redirectWithMessage } from "@/lib/redirect";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  processFacebookLead,
  resolveFacebookWebhookContext,
} from "@/features/facebook/leadgen-server";
import {
  facebookLeadFormMappingSchema,
  facebookLeadRetrySchema,
} from "@/features/facebook/validators";
import type { Json } from "@/lib/supabase/database.types";

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
    (!candidate.startsWith("/admin/facebook") &&
      !candidate.startsWith("/admin/inquiries") &&
      !candidate.startsWith("/admin/pipeline") &&
      !candidate.startsWith("/admin/customers"))
  ) {
    return fallback;
  }

  return candidate;
}

function parseFieldMapJson(value: string): Json {
  try {
    return JSON.parse(value) as Json;
  } catch {
    return {};
  }
}

function revalidateFacebookLeadRoutes(input: {
  customerId?: string | null;
  inquiryId?: string | null;
}): void {
  revalidatePath("/admin/facebook");
  revalidatePath("/admin/facebook/leads");
  revalidatePath("/admin/facebook/lead-forms");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/customers");

  if (input.customerId) {
    revalidatePath(`/admin/customers/${input.customerId}`);
  }

  if (input.inquiryId) {
    revalidatePath(`/admin/inquiries/${input.inquiryId}`);
  }
}

export async function upsertFacebookLeadFormMapping(
  formData: FormData,
): Promise<void> {
  const fallbackPath = "/admin/facebook/lead-forms";
  const access = await requireAdminAccessContext(fallbackPath);
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    fallbackPath,
  );

  if (!access || !canManageFacebookSettings(access.membership.role)) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to manage lead form mappings.",
    );
  }

  const parsed = facebookLeadFormMappingSchema.safeParse({
    field_map_json: getStringValue(formData, "field_map_json"),
    form_id: getStringValue(formData, "form_id"),
    form_name: getStringValue(formData, "form_name"),
    is_active: getStringValue(formData, "is_active") || "true",
    mapping_id: getStringValue(formData, "mapping_id"),
    redirect_to: redirectPath,
    vehicle_id: getStringValue(formData, "vehicle_id"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Please correct the mapping details and try again.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const payload = {
    dealership_id: access.dealership.id,
    field_map: parseFieldMapJson(parsed.data.field_map_json),
    form_id: parsed.data.form_id,
    form_name: parsed.data.form_name,
    is_active: parsed.data.is_active,
    vehicle_id: parsed.data.vehicle_id || null,
  };

  if (parsed.data.mapping_id) {
    const { error } = await supabase
      .from("facebook_lead_form_mappings")
      .update(payload)
      .eq("dealership_id", access.dealership.id)
      .eq("id", parsed.data.mapping_id);

    if (error) {
      redirectWithMessage(
        redirectPath,
        "error",
        "Unable to update the lead form mapping.",
      );
    }
  } else {
    const { error } = await supabase
      .from("facebook_lead_form_mappings")
      .insert(payload);

    if (error) {
      redirectWithMessage(
        redirectPath,
        "error",
        "Unable to save the lead form mapping.",
      );
    }
  }

  revalidatePath("/admin/facebook");
  revalidatePath("/admin/facebook/lead-forms");
  redirectWithMessage(redirectPath, "success", "Lead form mapping saved.");
}

export async function deactivateFacebookLeadFormMapping(
  formData: FormData,
): Promise<void> {
  const fallbackPath = "/admin/facebook/lead-forms";
  const access = await requireAdminAccessContext(fallbackPath);
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    fallbackPath,
  );
  const mappingId = getStringValue(formData, "mapping_id");

  if (!access || !canManageFacebookSettings(access.membership.role)) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to manage lead form mappings.",
    );
  }

  if (!mappingId) {
    redirectWithMessage(redirectPath, "error", "Lead form mapping not found.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("facebook_lead_form_mappings")
    .update({
      is_active: false,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", mappingId);

  if (error) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Unable to deactivate the lead form mapping.",
    );
  }

  revalidatePath("/admin/facebook");
  revalidatePath("/admin/facebook/lead-forms");
  redirectWithMessage(redirectPath, "success", "Lead form mapping deactivated.");
}

export async function retryFacebookLeadProcessing(
  formData: FormData,
): Promise<void> {
  const fallbackPath = "/admin/facebook/leads";
  const access = await requireAdminAccessContext(fallbackPath);
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    fallbackPath,
  );

  if (!access || !canCreateLeads(access.membership.role)) {
    redirectWithMessage(
      redirectPath,
      "error",
      "You do not have permission to retry Facebook lead processing.",
    );
  }

  const parsed = facebookLeadRetrySchema.safeParse({
    lead_id: getStringValue(formData, "lead_id"),
    redirect_to: redirectPath,
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Facebook lead not found.");
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: lead } = await adminSupabase
    .from("facebook_leads")
    .select("id, leadgen_id, page_id")
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.lead_id)
    .maybeSingle<{
      id: string;
      leadgen_id: string;
      page_id: string | null;
    }>();

  if (!lead || !lead.page_id) {
    redirectWithMessage(
      redirectPath,
      "error",
      "This Facebook lead does not have enough context to retry.",
    );
  }

  const webhookContext = await resolveFacebookWebhookContext(lead.page_id);

  if (!webhookContext || webhookContext.dealershipId !== access.dealership.id) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Facebook Page context could not be resolved for this lead.",
    );
  }

  const result = await processFacebookLead({
    context: webhookContext,
    parsedEvent: {
      adId: null,
      createdTime: null,
      eventKey: `lead_form:${lead.page_id}:${lead.leadgen_id}`,
      eventName: "leadgen_retry",
      formId: null,
      leadgenId: lead.leadgen_id,
      pageId: lead.page_id,
      rawPayload: {
        retry: true,
      },
    },
  });

  if (result.status === "failed") {
    redirectWithMessage(
      redirectPath,
      "error",
      result.errorMessage || "Unable to process the Facebook lead right now.",
    );
  }

  revalidateFacebookLeadRoutes({
    customerId: result.customerId,
    inquiryId: result.inquiryId,
  });
  redirectWithMessage(
    redirectPath,
    "success",
    result.status === "duplicate"
      ? "This Facebook lead was already imported."
      : "Facebook lead processed successfully.",
  );
}
