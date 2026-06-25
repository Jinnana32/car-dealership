"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCustomer } from "@/features/customers/actions";
import type { CustomerDuplicateMatch } from "@/features/customers/types";
import {
  createInquiryForCustomer,
} from "@/features/inquiries/actions";
import type { Inquiry } from "@/features/inquiries/types";
import {
  searchPossibleCustomerDuplicatesInDealership,
} from "@/features/inquiries/queries";
import type {
  MessengerConversation,
  MessengerConversationConversionFormState,
} from "@/features/facebook/types";
import {
  convertMessengerConversationSchema,
  messengerConversationActionSchema,
  messengerDuplicateSearchSchema,
} from "@/features/facebook/validators";
import { canCreateLeads } from "@/lib/auth/permissions";
import type { AdminAccessContext } from "@/lib/auth/types";
import { requireAdminAccessContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const initialMessengerConversionState: MessengerConversationConversionFormState = {
  fieldErrors: {},
};

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
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

function sanitizeRedirectPath(
  candidate: string | undefined,
  fallback: string,
): string {
  if (
    !candidate ||
    (!candidate.startsWith("/admin/facebook/messenger") &&
      !candidate.startsWith("/admin/inquiries") &&
      !candidate.startsWith("/admin/customers") &&
      !candidate.startsWith("/admin/pipeline"))
  ) {
    return fallback;
  }

  return candidate;
}

function extractConversionValues(formData: FormData) {
  return {
    assigned_to: getStringValue(formData, "assigned_to"),
    budget_range: getStringValue(formData, "budget_range"),
    conversation_id: getStringValue(formData, "conversation_id"),
    customer_name: getStringValue(formData, "customer_name"),
    duplicate_resolution: getStringValue(
      formData,
      "duplicate_resolution",
    ) as "create_new" | "use_existing" | "",
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
    redirect_to: getStringValue(formData, "redirect_to"),
    source_detail: getStringValue(formData, "source_detail"),
    status: getStringValue(formData, "status") as Inquiry["status"],
  };
}

async function getAccessibleConversation(
  conversationId: string,
): Promise<{
  access: AdminAccessContext;
  conversation: MessengerConversation;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
} | null> {
  const access = await requireAdminAccessContext("/admin/facebook/messenger");

  if (!access || !canCreateLeads(access.membership.role)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: conversation } = await supabase
    .from("messenger_conversations")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", conversationId)
    .maybeSingle<MessengerConversation>();

  if (!conversation) {
    return null;
  }

  return {
    access,
    conversation,
    supabase,
  };
}

async function resolveVehicleForConversationUpdate(input: {
  access: AdminAccessContext;
  vehicleId: string | null;
}): Promise<{ id: string; slug: string } | null> {
  if (!input.vehicleId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id, slug")
    .eq("dealership_id", input.access.dealership.id)
    .eq("id", input.vehicleId)
    .maybeSingle<{ id: string; slug: string }>();

  return data ?? null;
}

async function annotateInquiryCreatedEvent(input: {
  access: AdminAccessContext;
  inquiryId: string;
}): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();
  const note = "Messenger conversation converted to inquiry.";
  const { data: existingEvent } = await adminSupabase
    .from("inquiry_events")
    .select("id")
    .eq("dealership_id", input.access.dealership.id)
    .eq("inquiry_id", input.inquiryId)
    .eq("event_type", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingEvent) {
    await adminSupabase
      .from("inquiry_events")
      .update({
        note,
      })
      .eq("id", existingEvent.id);

    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("inquiry_events").insert({
    created_by: input.access.profile.id,
    dealership_id: input.access.dealership.id,
    event_type: "created",
    inquiry_id: input.inquiryId,
    metadata: {
      source: "facebook_messenger",
    },
    note,
  });
}

function revalidateMessengerSurfaces(input: {
  conversationId: string;
  customerId?: string | null;
  inquiryId?: string | null;
}): void {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/facebook");
  revalidatePath("/admin/facebook/messenger");
  revalidatePath(`/admin/facebook/messenger/${input.conversationId}`);

  if (input.customerId) {
    revalidatePath(`/admin/customers/${input.customerId}`);
  }

  if (input.inquiryId) {
    revalidatePath(`/admin/inquiries/${input.inquiryId}`);
  }
}

async function updateConversationStatus(input: {
  conversationId: string;
  nextStatus: MessengerConversation["status"];
  redirectPath: string;
  successMessage: string;
}): Promise<void> {
  const result = await getAccessibleConversation(input.conversationId);

  if (!result) {
    redirectWithMessage(
      input.redirectPath,
      "error",
      "Messenger conversation not found or not accessible.",
    );
  }

  const { conversation, supabase } = result;

  if (conversation.status === "converted") {
    redirectWithMessage(
      input.redirectPath,
      "error",
      "Converted conversations cannot be changed from the Messenger review flow.",
    );
  }

  if (conversation.status === input.nextStatus) {
    redirectWithMessage(input.redirectPath, "success", input.successMessage);
  }

  const { error } = await supabase
    .from("messenger_conversations")
    .update({
      status: input.nextStatus,
    })
    .eq("id", conversation.id);

  if (error) {
    redirectWithMessage(
      input.redirectPath,
      "error",
      "Unable to update the Messenger conversation.",
    );
  }

  revalidateMessengerSurfaces({
    conversationId: conversation.id,
    customerId: conversation.customer_id,
    inquiryId: conversation.inquiry_id,
  });
  redirectWithMessage(input.redirectPath, "success", input.successMessage);
}

export async function searchMessengerCustomerDuplicates(input: {
  customer_name: string;
  email: string | null;
  phone: string | null;
}): Promise<CustomerDuplicateMatch[]> {
  const access = await requireAdminAccessContext("/admin/facebook/messenger");

  if (!access || !canCreateLeads(access.membership.role)) {
    return [];
  }

  const parsed = messengerDuplicateSearchSchema.safeParse(input);

  if (!parsed.success) {
    return [];
  }

  return searchPossibleCustomerDuplicatesInDealership(access, {
    customerName: parsed.data.customer_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
  });
}

export async function markMessengerConversationReviewed(
  formData: FormData,
): Promise<void> {
  const parsed = messengerConversationActionSchema.safeParse({
    conversation_id: getStringValue(formData, "conversation_id"),
    redirect_to: getStringValue(formData, "redirect_to"),
  });
  const redirectPath = sanitizeRedirectPath(
    parsed.success ? parsed.data.redirect_to : undefined,
    "/admin/facebook/messenger",
  );

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Messenger conversation action is invalid.",
    );
  }

  await updateConversationStatus({
    conversationId: parsed.data.conversation_id,
    nextStatus: "reviewed",
    redirectPath,
    successMessage: "Messenger conversation marked reviewed.",
  });
}

export async function ignoreMessengerConversation(
  formData: FormData,
): Promise<void> {
  const parsed = messengerConversationActionSchema.safeParse({
    conversation_id: getStringValue(formData, "conversation_id"),
    redirect_to: getStringValue(formData, "redirect_to"),
  });
  const redirectPath = sanitizeRedirectPath(
    parsed.success ? parsed.data.redirect_to : undefined,
    "/admin/facebook/messenger",
  );

  if (!parsed.success) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Messenger conversation action is invalid.",
    );
  }

  await updateConversationStatus({
    conversationId: parsed.data.conversation_id,
    nextStatus: "ignored",
    redirectPath,
    successMessage: "Messenger conversation ignored.",
  });
}

export async function convertMessengerConversationToInquiry(
  previousState: MessengerConversationConversionFormState = initialMessengerConversionState,
  formData: FormData,
): Promise<MessengerConversationConversionFormState> {
  void previousState;

  const access = await requireAdminAccessContext("/admin/facebook/messenger");

  if (!access || !canCreateLeads(access.membership.role)) {
    return {
      error: "You do not have permission to convert Messenger conversations.",
      fieldErrors: {},
    };
  }

  const values = extractConversionValues(formData);
  const parsed = convertMessengerConversationSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const conversationResult = await getAccessibleConversation(parsed.data.conversation_id);

  if (!conversationResult) {
    return {
      error: "Messenger conversation not found or not accessible.",
      fieldErrors: {},
      values,
    };
  }

  const { conversation, supabase } = conversationResult;

  if (conversation.inquiry_id) {
    redirectWithMessage(
      `/admin/inquiries/${conversation.inquiry_id}`,
      "success",
      "This conversation is already linked to an inquiry.",
    );
  }

  let customerId = parsed.data.existing_customer_id;

  if (!customerId) {
    const duplicates = await searchMessengerCustomerDuplicates({
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
      source_type: "facebook_messenger",
    });

    if (customerResult.error || !customerResult.data) {
      return {
        error: customerResult.error ?? "Unable to create the customer right now.",
        fieldErrors: customerResult.fieldErrors ?? {},
        values,
      };
    }

    customerId = customerResult.data.customer.id;
  }

  const selectedVehicleId =
    parsed.data.interested_vehicle_id || conversation.vehicle_id;
  const selectedVehicle = await resolveVehicleForConversationUpdate({
    access,
    vehicleId: selectedVehicleId,
  });
  const inquiryResult = await createInquiryForCustomer({
    assigned_to: parsed.data.assigned_to,
    budget_range: parsed.data.budget_range,
    customer_id: customerId,
    next_follow_up_at: parsed.data.next_follow_up_at,
    original_message:
      parsed.data.message ||
      conversation.last_message ||
      conversation.last_message_preview ||
      null,
    payment_preference:
      parsed.data.payment_preference === ""
        ? null
        : parsed.data.payment_preference,
    source_detail: parsed.data.source_detail || "Facebook Messenger",
    source_reference_id: conversation.id,
    source_type: "facebook_messenger",
    status: "new",
    vehicle_id: selectedVehicle?.id ?? null,
  });

  if (inquiryResult.error || !inquiryResult.data) {
    return {
      error: inquiryResult.error ?? "Unable to create the inquiry right now.",
      fieldErrors: inquiryResult.fieldErrors ?? {},
      values,
    };
  }

  const inquiryId = inquiryResult.data.inquiry.id;
  await annotateInquiryCreatedEvent({
    access,
    inquiryId,
  });

  const { error: leadSourceError } = await supabase
    .from("lead_source_events")
    .insert({
      customer_id: customerId,
      dealership_id: access.dealership.id,
      event_name: "messenger_conversation_converted",
      external_reference_id: conversation.id,
      inquiry_id: inquiryId,
      metadata: {
        conversation_id: conversation.id,
        page_id: conversation.page_id,
        referral_ref: conversation.referral_ref,
        sender_id: conversation.sender_id,
        sender_psid: conversation.sender_psid,
        vehicle_slug:
          selectedVehicle?.slug ?? conversation.vehicle_slug,
      },
      source_detail: parsed.data.source_detail || "Facebook Messenger",
      source_type: "facebook_messenger",
      vehicle_id: selectedVehicle?.id ?? null,
    });

  if (leadSourceError) {
    return {
      error: "Inquiry created, but the Messenger source event could not be recorded.",
      fieldErrors: {},
      values,
    };
  }

  const { error: conversationUpdateError } = await supabase
    .from("messenger_conversations")
    .update({
      customer_id: customerId,
      inquiry_id: inquiryId,
      last_message:
        conversation.last_message ?? conversation.last_message_preview,
      referral_ref: conversation.referral_ref,
      status: "converted",
      vehicle_id: selectedVehicle?.id ?? null,
      vehicle_slug:
        selectedVehicle?.slug ?? conversation.vehicle_slug,
    })
    .eq("dealership_id", access.dealership.id)
    .eq("id", conversation.id);

  if (conversationUpdateError) {
    return {
      error: "Inquiry created, but the Messenger conversation could not be linked.",
      fieldErrors: {},
      values,
    };
  }

  revalidateMessengerSurfaces({
    conversationId: conversation.id,
    customerId,
    inquiryId,
  });

  redirectWithMessage(
    `/admin/inquiries/${inquiryId}`,
    "success",
    "Messenger conversation converted to inquiry.",
  );
}
