import "server-only";

import {
  loadCustomerMatchIndex,
  resolveCustomerForFacebookAuthor,
  type CustomerMatchIndex,
} from "@/features/facebook/comment-customer-matching";
import { FACEBOOK_MESSENGER_PAGE_ID } from "@/features/facebook/constants";
import { resolveMessengerVehicleContext } from "@/features/facebook/messenger-vehicle-context";
import { createFacebookApiLog, resolveFacebookWebhookContext } from "@/features/facebook/leadgen-server";
import type {
  MessengerConversation,
  MessengerConversationInsert,
  MessengerMessageInsert,
} from "@/features/facebook/types";
import { buildCustomerNameParts } from "@/features/inquiries/utils";
import {
  fetchFacebookPageConversations,
  hasFacebookMessengerSyncAccess,
  sanitizeFacebookGraphMessengerMessagesForLog,
  type FacebookGraphMessengerMessage,
} from "@/lib/facebook/graph-messenger";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SYNC_ENDPOINT = "/api/cron/facebook-comment-sync";
const MESSENGER_SOURCE_DETAIL = "Facebook Messenger poll sync";
const MESSENGER_EVENT_NAME = "messenger_message_received";

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

type ResolvedFacebookWebhookContext = NonNullable<
  Awaited<ReturnType<typeof resolveFacebookWebhookContext>>
>;

export type FacebookMessengerSyncSummary = {
  conversationsFetched: number;
  duplicateCount: number;
  failedCount: number;
  inquiryCount: number;
  messagesFetched: number;
  processedCount: number;
  skippedReason: string | null;
};

export type MessengerSyncProcessingSummary = {
  conversationId: string | null;
  customerId: string | null;
  errorMessage?: string;
  inquiryCreated: boolean;
  inquiryId: string | null;
  messageId: string | null;
  status: "duplicate" | "failed" | "processed";
};

async function createCustomerFromMessengerAuthor(input: {
  adminSupabase: AdminSupabaseClient;
  authorFacebookId: string;
  authorName: string;
  dealershipId: string;
}): Promise<string> {
  const { firstName, lastName } = buildCustomerNameParts(input.authorName);

  const { data, error } = await input.adminSupabase
    .from("customers")
    .insert({
      dealership_id: input.dealershipId,
      fb_customer_id: input.authorFacebookId,
      first_name: firstName,
      full_name: input.authorName,
      last_name: lastName,
      source_type: "facebook_messenger",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error("customer_create_failed");
  }

  return data.id;
}

async function upsertMessengerConversationRow(input: {
  adminSupabase: AdminSupabaseClient;
  context: ResolvedFacebookWebhookContext;
  message: FacebookGraphMessengerMessage;
}): Promise<MessengerConversation | null> {
  const { data: existingConversation } = await input.adminSupabase
    .from("messenger_conversations")
    .select("*")
    .eq("dealership_id", input.context.dealershipId)
    .eq("page_id", input.context.pageId)
    .eq("sender_psid", input.message.senderFacebookId)
    .maybeSingle<MessengerConversation>();

  const vehicleContext = await resolveMessengerVehicleContext({
    adminSupabase: input.adminSupabase,
    dealershipId: input.context.dealershipId,
    messageText: input.message.messageText,
    referralRef: existingConversation?.referral_ref ?? null,
  });

  const payload: MessengerConversationInsert = {
    customer_id: existingConversation?.customer_id ?? null,
    dealership_id: input.context.dealershipId,
    facebook_connection_id: input.context.facebookConnectionId,
    inquiry_id: existingConversation?.inquiry_id ?? null,
    last_message: input.message.messageText,
    last_message_at: input.message.createdTime,
    last_message_preview: input.message.messageText,
    metadata: {
      conversation_thread_id: input.message.conversationThreadId,
      last_message_id: input.message.messageId,
      sync_source: "facebook_messenger_poll",
      ...(vehicleContext.vehicleRef
        ? { resolved_vehicle_ref: vehicleContext.vehicleRef }
        : {}),
    } satisfies Json,
    page_id: input.context.pageId,
    referral_ref: existingConversation?.referral_ref ?? vehicleContext.vehicleRef,
    sender_id: input.message.senderFacebookId,
    sender_psid: input.message.senderFacebookId,
    status:
      existingConversation?.status === "converted"
        ? "converted"
        : existingConversation?.status ?? "new",
    vehicle_id: existingConversation?.vehicle_id ?? vehicleContext.vehicleId,
    vehicle_slug: existingConversation?.vehicle_slug ?? vehicleContext.vehicleSlug,
  };

  const { data, error } = await input.adminSupabase
    .from("messenger_conversations")
    .upsert(payload, {
      onConflict: "dealership_id,page_id,sender_psid",
    })
    .select("*")
    .single<MessengerConversation>();

  if (error || !data) {
    return null;
  }

  return data;
}

async function insertMessengerMessageRow(input: {
  adminSupabase: AdminSupabaseClient;
  context: ResolvedFacebookWebhookContext;
  conversationId: string;
  message: FacebookGraphMessengerMessage;
}): Promise<"created" | "duplicate" | "error"> {
  const payload: MessengerMessageInsert = {
    conversation_id: input.conversationId,
    dealership_id: input.context.dealershipId,
    direction: "inbound",
    facebook_connection_id: input.context.facebookConnectionId,
    facebook_message_id: input.message.messageId,
    message_text: input.message.messageText,
    metadata: {
      conversation_thread_id: input.message.conversationThreadId,
      sync_source: "facebook_messenger_poll",
    } satisfies Json,
    page_id: input.context.pageId,
    raw_payload: {
      conversation_thread_id: input.message.conversationThreadId,
      from: {
        id: input.message.senderFacebookId,
        name: input.message.senderName,
      },
      message: input.message.messageText,
      message_id: input.message.messageId,
      sync_source: "facebook_messenger_poll",
    } as Json,
    sender_psid: input.message.senderFacebookId,
    sent_at: input.message.createdTime,
  };

  const { error } = await input.adminSupabase.from("messenger_messages").insert(payload);

  if (!error) {
    return "created";
  }

  return error.code === "23505" ? "duplicate" : "error";
}

async function findExistingInquiryByConversationId(input: {
  adminSupabase: AdminSupabaseClient;
  conversationId: string;
  dealershipId: string;
}): Promise<string | null> {
  const { data } = await input.adminSupabase
    .from("inquiries")
    .select("id")
    .eq("dealership_id", input.dealershipId)
    .eq("source_type", "facebook_messenger")
    .eq("source_reference_id", input.conversationId)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}

async function annotateMessengerInquiryArtifacts(input: {
  adminSupabase: AdminSupabaseClient;
  conversationId: string;
  customerId: string;
  dealershipId: string;
  inquiryId: string;
  message: FacebookGraphMessengerMessage;
  pageId: string;
  vehicleId: string | null;
}): Promise<void> {
  await input.adminSupabase.from("inquiry_events").insert({
    dealership_id: input.dealershipId,
    event_type: "created",
    inquiry_id: input.inquiryId,
    metadata: {
      conversation_id: input.conversationId,
      conversation_thread_id: input.message.conversationThreadId,
      message_id: input.message.messageId,
      sender_facebook_id: input.message.senderFacebookId,
      source: "facebook_messenger_poll",
    } satisfies Json,
    note: "Facebook Messenger conversation imported.",
  });

  await input.adminSupabase.from("lead_source_events").insert({
    customer_id: input.customerId,
    dealership_id: input.dealershipId,
    event_name: MESSENGER_EVENT_NAME,
    external_reference_id: input.message.messageId,
    inquiry_id: input.inquiryId,
    metadata: {
      conversation_id: input.conversationId,
      conversation_thread_id: input.message.conversationThreadId,
      message_id: input.message.messageId,
      page_id: input.pageId,
      sender_facebook_id: input.message.senderFacebookId,
    } satisfies Json,
    source_detail: MESSENGER_SOURCE_DETAIL,
    source_type: "facebook_messenger",
    vehicle_id: input.vehicleId,
  });
}

async function ensureInquiryForConversation(input: {
  adminSupabase: AdminSupabaseClient;
  context: ResolvedFacebookWebhookContext;
  conversation: MessengerConversation;
  customerMatchIndex?: CustomerMatchIndex;
  message: FacebookGraphMessengerMessage;
}): Promise<{ created: boolean; inquiryId: string | null }> {
  if (input.conversation.inquiry_id) {
    return {
      created: false,
      inquiryId: input.conversation.inquiry_id,
    };
  }

  const existingInquiryId = await findExistingInquiryByConversationId({
    adminSupabase: input.adminSupabase,
    conversationId: input.conversation.id,
    dealershipId: input.context.dealershipId,
  });

  if (existingInquiryId) {
    await input.adminSupabase
      .from("messenger_conversations")
      .update({
        inquiry_id: existingInquiryId,
        status: "converted",
      })
      .eq("id", input.conversation.id);

    return {
      created: false,
      inquiryId: existingInquiryId,
    };
  }

  let customerId = input.conversation.customer_id;

  if (!customerId) {
    customerId = await resolveCustomerForFacebookAuthor({
      adminSupabase: input.adminSupabase,
      authorFacebookId: input.message.senderFacebookId,
      authorName: input.message.senderName,
      dealershipId: input.context.dealershipId,
      matchIndex: input.customerMatchIndex,
    });
  }

  if (!customerId) {
    customerId = await createCustomerFromMessengerAuthor({
      adminSupabase: input.adminSupabase,
      authorFacebookId: input.message.senderFacebookId,
      authorName: input.message.senderName,
      dealershipId: input.context.dealershipId,
    });
  }

  const { data: inquiry, error: inquiryError } = await input.adminSupabase
    .from("inquiries")
    .insert({
      customer_id: customerId,
      dealership_id: input.context.dealershipId,
      next_follow_up_at: input.message.createdTime,
      original_message: input.message.messageText,
      source_detail: MESSENGER_SOURCE_DETAIL,
      source_reference_id: input.conversation.id,
      source_type: "facebook_messenger",
      status: "new",
      vehicle_id: input.conversation.vehicle_id,
    })
    .select("id")
    .single<{ id: string }>();

  if (inquiryError || !inquiry) {
    throw new Error("inquiry_create_failed");
  }

  await annotateMessengerInquiryArtifacts({
    adminSupabase: input.adminSupabase,
    conversationId: input.conversation.id,
    customerId,
    dealershipId: input.context.dealershipId,
    inquiryId: inquiry.id,
    message: input.message,
    pageId: input.context.pageId,
    vehicleId: input.conversation.vehicle_id,
  });

  await input.adminSupabase
    .from("messenger_conversations")
    .update({
      customer_id: customerId,
      inquiry_id: inquiry.id,
      status: "converted",
    })
    .eq("id", input.conversation.id);

  return {
    created: true,
    inquiryId: inquiry.id,
  };
}

export async function processMessengerSyncMessage(input: {
  adminSupabase: AdminSupabaseClient;
  context: ResolvedFacebookWebhookContext;
  customerMatchIndex?: CustomerMatchIndex;
  message: FacebookGraphMessengerMessage;
}): Promise<MessengerSyncProcessingSummary> {
  const conversation = await upsertMessengerConversationRow({
    adminSupabase: input.adminSupabase,
    context: input.context,
    message: input.message,
  });

  if (!conversation) {
    return {
      conversationId: null,
      customerId: null,
      errorMessage: "Unable to store the Messenger conversation.",
      inquiryCreated: false,
      inquiryId: null,
      messageId: null,
      status: "failed",
    };
  }

  const messageInsertState = await insertMessengerMessageRow({
    adminSupabase: input.adminSupabase,
    context: input.context,
    conversationId: conversation.id,
    message: input.message,
  });

  if (messageInsertState === "error") {
    return {
      conversationId: conversation.id,
      customerId: conversation.customer_id,
      errorMessage: "Unable to store the Messenger message.",
      inquiryCreated: false,
      inquiryId: conversation.inquiry_id,
      messageId: null,
      status: "failed",
    };
  }

  if (messageInsertState === "duplicate") {
    return {
      conversationId: conversation.id,
      customerId: conversation.customer_id,
      inquiryCreated: false,
      inquiryId: conversation.inquiry_id,
      messageId: input.message.messageId,
      status: "duplicate",
    };
  }

  try {
    const inquiryResult = await ensureInquiryForConversation({
      adminSupabase: input.adminSupabase,
      context: input.context,
      conversation,
      customerMatchIndex: input.customerMatchIndex,
      message: input.message,
    });

    return {
      conversationId: conversation.id,
      customerId: conversation.customer_id,
      inquiryCreated: inquiryResult.created,
      inquiryId: inquiryResult.inquiryId,
      messageId: input.message.messageId,
      status: "processed",
    };
  } catch (error) {
    return {
      conversationId: conversation.id,
      customerId: conversation.customer_id,
      errorMessage:
        error instanceof Error
          ? error.message.replaceAll("_", " ")
          : "Unable to process Messenger conversation.",
      inquiryCreated: false,
      inquiryId: conversation.inquiry_id,
      messageId: input.message.messageId,
      status: "failed",
    };
  }
}

export async function syncFacebookMessengerConversations(): Promise<FacebookMessengerSyncSummary> {
  const summary: FacebookMessengerSyncSummary = {
    conversationsFetched: 0,
    duplicateCount: 0,
    failedCount: 0,
    inquiryCount: 0,
    messagesFetched: 0,
    processedCount: 0,
    skippedReason: null,
  };

  if (!hasFacebookMessengerSyncAccess()) {
    summary.skippedReason = "facebook_messenger_sync_not_configured";

    return summary;
  }

  const pageId = FACEBOOK_MESSENGER_PAGE_ID;
  const webhookContext = await resolveFacebookWebhookContext(pageId);

  if (!webhookContext) {
    summary.skippedReason = "facebook_messenger_sync_context_not_found";

    return summary;
  }

  let messages: FacebookGraphMessengerMessage[] = [];

  try {
    messages = await fetchFacebookPageConversations({
      pageId,
    });
  } catch (error) {
    summary.failedCount += 1;
    summary.skippedReason =
      error instanceof Error ? error.message : "facebook_messenger_sync_fetch_failed";

    await createFacebookApiLog({
      action: "facebook_messenger_sync_fetch_failed",
      dealershipId: webhookContext.dealershipId,
      endpoint: SYNC_ENDPOINT,
      errorMessage: summary.skippedReason,
      requestPayload: {
        page_id: pageId,
      },
      responsePayload: {
        status: "error",
      },
      status: "error",
      statusCode: 500,
    });

    return summary;
  }

  summary.messagesFetched = messages.length;
  summary.conversationsFetched = new Set(messages.map((message) => message.conversationThreadId))
    .size;

  if (messages.length === 0) {
    return summary;
  }

  const adminSupabase = createSupabaseAdminClient();
  const customerMatchIndex = await loadCustomerMatchIndex({
    adminSupabase,
    dealershipId: webhookContext.dealershipId,
  });

  const inquiryIdsCreated = new Set<string>();

  for (const message of messages) {
    const result = await processMessengerSyncMessage({
      adminSupabase,
      context: webhookContext,
      customerMatchIndex,
      message,
    });

    if (result.status === "processed") {
      summary.processedCount += 1;

      if (result.inquiryCreated && result.inquiryId) {
        inquiryIdsCreated.add(result.inquiryId);
        summary.inquiryCount += 1;
      }
    } else if (result.status === "duplicate") {
      summary.duplicateCount += 1;
    } else {
      summary.failedCount += 1;
    }
  }

  await createFacebookApiLog({
    action: "facebook_messenger_sync_processed",
    dealershipId: webhookContext.dealershipId,
    endpoint: SYNC_ENDPOINT,
    requestPayload: {
      page_id: pageId,
    },
    responsePayload: {
      conversations_fetched: summary.conversationsFetched,
      messages: sanitizeFacebookGraphMessengerMessagesForLog(messages),
      messages_fetched: summary.messagesFetched,
      summary,
    },
    status: "success",
    statusCode: 200,
  });

  return summary;
}
