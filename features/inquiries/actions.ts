"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { createCustomer } from "@/features/customers/actions";
import type { CustomerDuplicateMatch } from "@/features/customers/types";
import {
  getDealershipMemberOptions,
  getInquiryById,
  getVehicleOptions,
  searchPossibleCustomerDuplicatesInDealership,
} from "@/features/inquiries/queries";
import type {
  DealershipMemberOption,
  Inquiry,
  InquiryEvent,
  InquiryInsert,
  InquiryRecord,
  InquirySourceType,
  ManualLeadFormState,
  VehicleOption,
} from "@/features/inquiries/types";
import {
  assignmentUpdateSchema,
  createInquirySchema,
  createManualLeadSchema,
  followUpUpdateSchema,
  inquiryNoteSchema,
  searchPossibleCustomerDuplicatesSchema,
  updateInquirySchema,
} from "@/features/inquiries/validators";
import {
  canAssignInquiries,
  canCreateLeads,
  canManageDealership,
  canManageInquiryRecord,
  canRecordSales,
} from "@/lib/auth/permissions";
import type { AdminAccessContext } from "@/lib/auth/types";
import { requireAdminAccessContext } from "@/lib/auth/session";
import { redirectWithMessage } from "@/lib/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  markInquiryLostSchema,
  markInquiryWonSchema,
  moveInquiryToStageSchema,
  updateInquiryStatusSchema,
} from "@/features/pipeline/validators";
import { getVehicleSaleRecordByInquiryId } from "@/features/sales/queries";
import type { VehicleSaleRecord } from "@/features/sales/types";

type ActionResult<T> = {
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};

const initialLeadFormState: ManualLeadFormState = {
  fieldErrors: {},
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
      !candidate.startsWith("/admin/customers") &&
      !candidate.startsWith("/admin/pipeline") &&
      !candidate.startsWith("/admin/leads/new"))
  ) {
    return fallback;
  }

  return candidate;
}

function extractLeadFormValues(formData: FormData) {
  return {
    assigned_to: getStringValue(formData, "assigned_to"),
    budget_range: getStringValue(formData, "budget_range"),
    customer_name: getStringValue(formData, "customer_name"),
    duplicate_resolution: getStringValue(formData, "duplicate_resolution") as
      | "create_new"
      | "use_existing"
      | "",
    email: getStringValue(formData, "email"),
    existing_customer_id: getStringValue(formData, "existing_customer_id"),
    interested_vehicle_id: getStringValue(formData, "interested_vehicle_id"),
    message: getStringValue(formData, "message"),
    next_follow_up_at: getStringValue(formData, "next_follow_up_at"),
    payment_preference: getStringValue(formData, "payment_preference") as
      | "cash"
      | "financing"
      | "undecided"
      | "",
    phone: getStringValue(formData, "phone"),
    source_detail: getStringValue(formData, "source_detail"),
    source_type: getStringValue(formData, "source_type") as
      | "manual_entry"
      | "phone_call"
      | "walk_in"
      | "referral"
      | "facebook_comment"
      | "viber"
      | "whatsapp"
      | "other",
    status: getStringValue(formData, "status") as Inquiry["status"],
  };
}

async function getAccessibleInquiry(
  inquiryId: string,
): Promise<{
  access: AdminAccessContext;
  inquiry: Inquiry;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
} | null> {
  const access = await requireAdminAccessContext("/admin/inquiries");

  if (!access || !canCreateLeads(access.membership.role)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiryId)
    .maybeSingle<Inquiry>();

  if (!inquiry) {
    return null;
  }

  return {
    access,
    inquiry,
    supabase,
  };
}

async function insertInquiryEvent(input: {
  createdBy: string;
  dealershipId: string;
  eventType: InquiryEvent["event_type"];
  inquiryId: string;
  metadata?: Record<string, string | null>;
  newStatus?: string | null;
  note?: string | null;
  oldStatus?: string | null;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();

  await supabase.from("inquiry_events").insert({
    created_by: input.createdBy,
    dealership_id: input.dealershipId,
    event_type: input.eventType,
    inquiry_id: input.inquiryId,
    metadata: input.metadata ?? {},
    new_status: input.newStatus ?? null,
    note: input.note ?? null,
    old_status: input.oldStatus ?? null,
  });
}

function revalidateInquirySurfaces(input: {
  customerId?: string;
  inquiryId: string;
}): void {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");

  if (input.customerId) {
    revalidatePath(`/admin/customers/${input.customerId}`);
  }

  revalidatePath(`/admin/inquiries/${input.inquiryId}`);
}

async function transitionInquiryStatus(input: {
  inquiryId: string;
  redirectPath: string;
  successMessage: string;
  targetStatus: Inquiry["status"];
}): Promise<void> {
  const result = await getAccessibleInquiry(input.inquiryId);

  if (!result) {
    redirectWithMessage(input.redirectPath, "error", "Inquiry not found or not accessible.");
  }

  const { access, inquiry, supabase } = result;

  if (inquiry.status === input.targetStatus) {
    redirectWithMessage(input.redirectPath, "success", input.successMessage);
  }

  const { error } = await supabase
    .from("inquiries")
    .update({
      lost_reason: null,
      status: input.targetStatus,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiry.id);

  if (error) {
    redirectWithMessage(input.redirectPath, "error", "Unable to update the inquiry stage.");
  }

  await insertInquiryEvent({
    createdBy: access.profile.id,
    dealershipId: access.dealership.id,
    eventType: "status_changed",
    inquiryId: inquiry.id,
    newStatus: input.targetStatus,
    oldStatus: inquiry.status,
  });

  revalidateInquirySurfaces({
    customerId: inquiry.customer_id,
    inquiryId: inquiry.id,
  });
  revalidatePath(input.redirectPath);
  redirectWithMessage(input.redirectPath, "success", input.successMessage);
}

export async function searchPossibleCustomerDuplicates(input: {
  customer_name: string;
  email: string | null;
  phone: string | null;
}): Promise<CustomerDuplicateMatch[]> {
  const access = await requireAdminAccessContext("/admin/leads/new");

  if (!access || !canCreateLeads(access.membership.role)) {
    return [];
  }

  const parsed = searchPossibleCustomerDuplicatesSchema.safeParse(input);

  if (!parsed.success) {
    return [];
  }

  return searchPossibleCustomerDuplicatesInDealership(access, {
    customerName: parsed.data.customer_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
  });
}

export async function createInquiryForCustomer(input: {
  assigned_to: string | null;
  budget_range: string | null;
  customer_id: string;
  next_follow_up_at: string | null;
  original_message: string | null;
  payment_preference: Inquiry["payment_preference"];
  source_detail: string | null;
  source_reference_id?: string | null;
  source_type: InquirySourceType;
  status: Inquiry["status"];
  vehicle_id: string | null;
}): Promise<ActionResult<{ inquiry: Inquiry }>> {
  const access = await requireAdminAccessContext("/admin/inquiries");

  if (!access || !canCreateLeads(access.membership.role)) {
    return {
      error: "You do not have permission to create inquiries.",
    };
  }

  const parsed = createInquirySchema.safeParse(input);

  if (!parsed.success) {
    const validationErrors = getValidationErrors(parsed.error);

    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: validationErrors.fieldErrors,
      formErrors: validationErrors.formErrors,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.customer_id)
    .maybeSingle();

  if (!customer) {
    return {
      error: "Customer not found.",
    };
  }

  const payload: InquiryInsert = {
    assigned_to: parsed.data.assigned_to,
    budget_range: parsed.data.budget_range,
    created_by: access.profile.id,
    customer_id: parsed.data.customer_id,
    dealership_id: access.dealership.id,
    next_follow_up_at: parsed.data.next_follow_up_at,
    original_message: parsed.data.original_message,
    payment_preference: parsed.data.payment_preference,
    source_detail: parsed.data.source_detail,
    source_reference_id: parsed.data.source_reference_id,
    source_type: parsed.data.source_type,
    status: parsed.data.status,
    vehicle_id: parsed.data.vehicle_id,
  };

  const { data, error } = await supabase
    .from("inquiries")
    .insert(payload)
    .select("*")
    .single<Inquiry>();

  if (error || !data) {
    return {
      error: "Unable to create the inquiry right now.",
    };
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");
  revalidatePath(`/admin/customers/${parsed.data.customer_id}`);

  return {
    data: {
      inquiry: data,
    },
  };
}

export async function createManualLead(
  previousState: ManualLeadFormState = initialLeadFormState,
  formData: FormData,
): Promise<ManualLeadFormState> {
  void previousState;

  const access = await requireAdminAccessContext("/admin/leads/new");

  if (!access || !canCreateLeads(access.membership.role)) {
    return {
      error: "You do not have permission to add leads.",
      fieldErrors: {},
    };
  }

  const values = extractLeadFormValues(formData);
  const parsed = createManualLeadSchema.safeParse(values);

  if (!parsed.success) {
    const validationErrors = getValidationErrors(parsed.error);

    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: validationErrors.fieldErrors,
      formErrors: validationErrors.formErrors,
      values,
    };
  }

  let customerId = parsed.data.existing_customer_id;

  if (!customerId) {
    const duplicates = await searchPossibleCustomerDuplicates({
      customer_name: parsed.data.customer_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
    });

    if (
      duplicates.length > 0 &&
      parsed.data.duplicate_resolution !== "create_new"
    ) {
      return {
        duplicates,
        error: "Possible existing customer found.",
        fieldErrors: {},
        values,
      };
    }

    if (parsed.data.duplicate_resolution === "use_existing") {
      return {
        error: "Select an existing customer to continue.",
        fieldErrors: {
          existing_customer_id: ["Select an existing customer to continue."],
        },
        values,
      };
    }
  }

  if (parsed.data.duplicate_resolution === "use_existing") {
    if (!parsed.data.existing_customer_id) {
      return {
        error: "Select an existing customer to continue.",
        fieldErrors: {
          existing_customer_id: ["Select an existing customer to continue."],
        },
        values,
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("dealership_id", access.dealership.id)
      .eq("id", parsed.data.existing_customer_id)
      .maybeSingle();

    if (!existingCustomer) {
      return {
        error: "Selected customer was not found.",
        fieldErrors: {
          existing_customer_id: ["Selected customer was not found."],
        },
        values,
      };
    }

    customerId = existingCustomer.id;
  }

  if (!customerId) {
    const customerResult = await createCustomer({
      email: parsed.data.email,
      full_name: parsed.data.customer_name,
      notes: null,
      phone: parsed.data.phone,
      source_type: parsed.data.source_type,
    });

    if (customerResult.error || !customerResult.data) {
      return {
        error: customerResult.error ?? "Unable to create the customer right now.",
        fieldErrors: customerResult.fieldErrors ?? {},
        formErrors: customerResult.formErrors ?? [],
        values,
      };
    }

    customerId = customerResult.data.customer.id;
  }

  const inquiryResult = await createInquiryForCustomer({
    assigned_to: parsed.data.assigned_to,
    budget_range: parsed.data.budget_range,
    customer_id: customerId,
    next_follow_up_at: parsed.data.next_follow_up_at,
    original_message: parsed.data.message || null,
    payment_preference:
      parsed.data.payment_preference === ""
        ? null
        : parsed.data.payment_preference,
    source_detail: parsed.data.source_detail,
    source_type: parsed.data.source_type,
    status: parsed.data.status,
    vehicle_id: parsed.data.interested_vehicle_id,
  });

  if (inquiryResult.error || !inquiryResult.data) {
    return {
      error: inquiryResult.error ?? "Unable to create the inquiry right now.",
      fieldErrors: inquiryResult.fieldErrors ?? {},
      formErrors: inquiryResult.formErrors ?? [],
      values,
    };
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/dashboard");
  redirectWithMessage(
    `/admin/inquiries/${inquiryResult.data.inquiry.id}`,
    "success",
    "Lead created.",
  );
}

export async function updateInquiry(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/inquiries",
  );
  const parsed = updateInquirySchema.safeParse({
    budget_range: formData.get("budget_range"),
    inquiry_id: formData.get("inquiry_id"),
    original_message: formData.get("original_message"),
    payment_preference: formData.get("payment_preference"),
    redirect_to: formData.get("redirect_to"),
    source_detail: formData.get("source_detail"),
    vehicle_id: formData.get("vehicle_id"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Please correct the inquiry details and try again.");
  }

  const result = await getAccessibleInquiry(parsed.data.inquiry_id);

  if (!result) {
    redirectWithMessage(redirectPath, "error", "Inquiry not found or not accessible.");
  }

  const { access, inquiry, supabase } = result;
  const { error } = await supabase
    .from("inquiries")
    .update({
      budget_range: parsed.data.budget_range,
      original_message: parsed.data.original_message,
      payment_preference: parsed.data.payment_preference,
      source_detail: parsed.data.source_detail,
      vehicle_id: parsed.data.vehicle_id,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.inquiry_id);

  if (error) {
    redirectWithMessage(redirectPath, "error", "Unable to update this inquiry.");
  }

  if (inquiry.vehicle_id !== parsed.data.vehicle_id) {
    await insertInquiryEvent({
      createdBy: access.profile.id,
      dealershipId: access.dealership.id,
      eventType: "vehicle_linked",
      inquiryId: inquiry.id,
      metadata: {
        new_vehicle_id: parsed.data.vehicle_id,
        old_vehicle_id: inquiry.vehicle_id,
      },
      note: parsed.data.vehicle_id
        ? "Linked to a different vehicle."
        : "Vehicle link removed.",
    });
  }

  revalidateInquirySurfaces({
    customerId: inquiry.customer_id,
    inquiryId: inquiry.id,
  });
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Inquiry updated.");
}

export async function updateInquiryStatus(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/pipeline",
  );
  const parsed = updateInquiryStatusSchema.safeParse({
    inquiry_id: formData.get("inquiry_id"),
    redirect_to: formData.get("redirect_to"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Select a valid pipeline stage.");
  }

  await transitionInquiryStatus({
    inquiryId: parsed.data.inquiry_id,
    redirectPath,
    successMessage: "Inquiry stage updated.",
    targetStatus: parsed.data.status,
  });
}

export async function moveInquiryToStage(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/pipeline",
  );
  const parsed = moveInquiryToStageSchema.safeParse({
    inquiry_id: formData.get("inquiry_id"),
    redirect_to: formData.get("redirect_to"),
    status: formData.get("target_status"),
    target_status: formData.get("target_status"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Select a valid stage.");
  }

  await transitionInquiryStatus({
    inquiryId: parsed.data.inquiry_id,
    redirectPath,
    successMessage: "Inquiry moved.",
    targetStatus: parsed.data.target_status,
  });
}

export async function assignInquiry(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/inquiries",
  );
  const parsed = assignmentUpdateSchema.safeParse({
    assigned_to: formData.get("assigned_to"),
    inquiry_id: formData.get("inquiry_id"),
    redirect_to: formData.get("redirect_to"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Select a valid assignee.");
  }

  const result = await getAccessibleInquiry(parsed.data.inquiry_id);

  if (!result) {
    redirectWithMessage(redirectPath, "error", "Inquiry not found or not accessible.");
  }

  if (!canManageDealership(result.access.membership.role)) {
    redirectWithMessage(redirectPath, "error", "Only owners and admins can reassign inquiries.");
  }

  const { access, inquiry, supabase } = result;
  const { error } = await supabase
    .from("inquiries")
    .update({
      assigned_to: parsed.data.assigned_to,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiry.id);

  if (error) {
    redirectWithMessage(redirectPath, "error", "Unable to update the assignee.");
  }

  if (parsed.data.assigned_to !== inquiry.assigned_to) {
    await insertInquiryEvent({
      createdBy: access.profile.id,
      dealershipId: access.dealership.id,
      eventType: "assigned",
      inquiryId: inquiry.id,
      metadata: {
        new_assigned_to: parsed.data.assigned_to,
        old_assigned_to: inquiry.assigned_to,
      },
    });
  }

  revalidateInquirySurfaces({
    customerId: inquiry.customer_id,
    inquiryId: inquiry.id,
  });
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Assignee updated.");
}

export async function setInquiryFollowUp(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/inquiries",
  );
  const parsed = followUpUpdateSchema.safeParse({
    inquiry_id: formData.get("inquiry_id"),
    next_follow_up_at: formData.get("next_follow_up_at"),
    redirect_to: formData.get("redirect_to"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Enter a valid follow-up date.");
  }

  const result = await getAccessibleInquiry(parsed.data.inquiry_id);

  if (!result) {
    redirectWithMessage(redirectPath, "error", "Inquiry not found or not accessible.");
  }

  const { access, inquiry, supabase } = result;
  const { error } = await supabase
    .from("inquiries")
    .update({
      next_follow_up_at: parsed.data.next_follow_up_at,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiry.id);

  if (error) {
    redirectWithMessage(redirectPath, "error", "Unable to update the follow-up date.");
  }

  if (parsed.data.next_follow_up_at !== inquiry.next_follow_up_at) {
    await insertInquiryEvent({
      createdBy: access.profile.id,
      dealershipId: access.dealership.id,
      eventType: "follow_up_set",
      inquiryId: inquiry.id,
      metadata: {
        new_follow_up_at: parsed.data.next_follow_up_at,
        old_follow_up_at: inquiry.next_follow_up_at,
      },
    });
  }

  revalidateInquirySurfaces({
    customerId: inquiry.customer_id,
    inquiryId: inquiry.id,
  });
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Follow-up updated.");
}

export async function addInquiryNote(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/inquiries",
  );
  const parsed = inquiryNoteSchema.safeParse({
    inquiry_id: formData.get("inquiry_id"),
    note: formData.get("note"),
    redirect_to: formData.get("redirect_to"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Add a note before saving.");
  }

  const result = await getAccessibleInquiry(parsed.data.inquiry_id);

  if (!result) {
    redirectWithMessage(redirectPath, "error", "Inquiry not found or not accessible.");
  }

  await insertInquiryEvent({
    createdBy: result.access.profile.id,
    dealershipId: result.access.dealership.id,
    eventType: "note_added",
    inquiryId: result.inquiry.id,
    note: parsed.data.note,
  });

  revalidateInquirySurfaces({
    customerId: result.inquiry.customer_id,
    inquiryId: result.inquiry.id,
  });
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Note added.");
}

export async function markInquiryLost(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/pipeline",
  );
  const parsed = markInquiryLostSchema.safeParse({
    inquiry_id: formData.get("inquiry_id"),
    lost_reason: formData.get("lost_reason"),
    note: formData.get("note"),
    redirect_to: formData.get("redirect_to"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      parsed.error.issues[0]?.message ?? "Add a valid lost reason.",
    );
  }

  const result = await getAccessibleInquiry(parsed.data.inquiry_id);

  if (!result) {
    redirectWithMessage(redirectPath, "error", "Inquiry not found or not accessible.");
  }

  const { access, inquiry, supabase } = result;
  const { error } = await supabase
    .from("inquiries")
    .update({
      lost_reason: parsed.data.lost_reason,
      status: "lost",
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiry.id);

  if (error) {
    redirectWithMessage(redirectPath, "error", "Unable to mark this inquiry as lost.");
  }

  await insertInquiryEvent({
    createdBy: access.profile.id,
    dealershipId: access.dealership.id,
    eventType: "marked_lost",
    inquiryId: inquiry.id,
    metadata: {
      lost_reason: parsed.data.lost_reason,
      old_status: inquiry.status,
    },
    newStatus: "lost",
    note: parsed.data.note || null,
    oldStatus: inquiry.status,
  });

  revalidateInquirySurfaces({
    customerId: inquiry.customer_id,
    inquiryId: inquiry.id,
  });
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Inquiry marked as lost.");
}

export async function markInquiryWon(formData: FormData): Promise<void> {
  const redirectPath = sanitizeRedirectPath(
    typeof formData.get("redirect_to") === "string"
      ? (formData.get("redirect_to") as string)
      : undefined,
    "/admin/pipeline",
  );
  const parsed = markInquiryWonSchema.safeParse({
    confirm: formData.get("confirm"),
    inquiry_id: formData.get("inquiry_id"),
    redirect_to: formData.get("redirect_to"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Confirm before marking this inquiry as won.");
  }

  const result = await getAccessibleInquiry(parsed.data.inquiry_id);

  if (!result) {
    redirectWithMessage(redirectPath, "error", "Inquiry not found or not accessible.");
  }

  const { access, inquiry, supabase } = result;
  const { error } = await supabase
    .from("inquiries")
    .update({
      lost_reason: null,
      status: "won",
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", inquiry.id);

  if (error) {
    redirectWithMessage(redirectPath, "error", "Unable to mark this inquiry as won.");
  }

  await insertInquiryEvent({
    createdBy: access.profile.id,
    dealershipId: access.dealership.id,
    eventType: "marked_won",
    inquiryId: inquiry.id,
    metadata: {
      old_status: inquiry.status,
    },
    newStatus: "won",
    oldStatus: inquiry.status,
  });

  revalidateInquirySurfaces({
    customerId: inquiry.customer_id,
    inquiryId: inquiry.id,
  });
  revalidatePath(redirectPath);
  redirectWithMessage(redirectPath, "success", "Inquiry marked as won.");
}

export type InquiryPanelDataResult =
  | { type: "forbidden" }
  | { type: "not_found" }
  | { type: "unauthorized" }
  | {
      data: {
        canAssignInquiries: boolean;
        canManageInquiry: boolean;
        canRecordSale: boolean;
        defaultFinancierName: string;
        financingAprPercent: number;
        memberOptions: DealershipMemberOption[];
        record: InquiryRecord;
        saleRecord: VehicleSaleRecord | null;
        vehicleOptions: VehicleOption[];
      };
      type: "ok";
    };

export async function loadInquiryPanelData(
  inquiryId: string,
): Promise<InquiryPanelDataResult> {
  const access = await requireAdminAccessContext("/admin/pipeline");

  if (!access) {
    return { type: "unauthorized" };
  }

  const [result, memberOptions, vehicleOptions] = await Promise.all([
    getInquiryById(access, inquiryId),
    getDealershipMemberOptions(access),
    getVehicleOptions(access),
  ]);

  if (result.type === "forbidden") {
    return { type: "forbidden" };
  }

  if (result.type === "not_found") {
    return { type: "not_found" };
  }

  const saleRecord = await getVehicleSaleRecordByInquiryId(
    access,
    result.record.inquiry.id,
  );

  return {
    data: {
      canAssignInquiries: canAssignInquiries(access.membership.role),
      canManageInquiry: canManageInquiryRecord(
        access.membership.role,
        access.profile.id,
        result.record.inquiry.assigned_to,
      ),
      canRecordSale: canRecordSales(access.membership.role),
      defaultFinancierName: access.dealership.name,
      financingAprPercent: access.dealership.default_financing_apr_percent,
      memberOptions,
      record: result.record,
      saleRecord,
      vehicleOptions,
    },
    type: "ok",
  };
}
