import { NextResponse } from "next/server";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getFacebookWebhookVerifyToken,
  hasFacebookWebhookVerifyToken,
  sanitizeFacebookRequestPayload,
  sanitizeFacebookResponsePayload,
} from "@/lib/facebook/server";
import type {
  FacebookApiLogInsert,
  FacebookWebhookEventInsert,
  MessengerConversation,
  MessengerConversationInsert,
  MessengerMessageInsert,
} from "@/features/facebook/types";
import {
  resolveMessengerVehicleContext,
  type ResolvedMessengerVehicleContext,
} from "@/features/facebook/messenger-vehicle-context";
import {
  facebookMessengerWebhookPayloadSchema,
  facebookWebhookVerificationSchema,
} from "@/features/facebook/validators";

const WEBHOOK_ENDPOINT = "/api/facebook/messenger/webhook";
const MESSENGER_SOURCE_DETAIL = "Messenger webhook inbound message";

type ResolvedWebhookContext = {
  dealershipId: string;
  facebookConnectionId: string | null;
  pageId: string;
};

type ResolvedVehicleContext = ResolvedMessengerVehicleContext;

type ParsedMessengerEvent = {
  eventKey: string;
  eventName: string;
  isInboundMessage: boolean;
  messageId: string;
  messageText: string | null;
  pageId: string;
  rawPayload: Record<string, unknown>;
  recipientId: string | null;
  referralRef: string | null;
  senderPsid: string;
  sentAt: string;
  status: "ignored" | "received";
  statusReason?: string;
};

function getStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNumberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getMessageTimestampIso(value: unknown): string {
  const timestamp = getNumberValue(value);

  if (!timestamp) {
    return new Date().toISOString();
  }

  const normalizedTimestamp =
    timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;

  return new Date(normalizedTimestamp).toISOString();
}

function getReferralRef(payload: Record<string, unknown>): string | null {
  const directReferral =
    payload.referral &&
    typeof payload.referral === "object" &&
    !Array.isArray(payload.referral)
      ? getStringValue((payload.referral as Record<string, unknown>).ref)
      : null;

  if (directReferral) {
    return directReferral;
  }

  const messageReferral =
    payload.message &&
    typeof payload.message === "object" &&
    !Array.isArray(payload.message) &&
    "referral" in payload.message &&
    payload.message.referral &&
    typeof payload.message.referral === "object" &&
    !Array.isArray(payload.message.referral)
      ? getStringValue(
          (payload.message.referral as Record<string, unknown>).ref,
        )
      : null;

  if (messageReferral) {
    return messageReferral;
  }

  const postbackReferral =
    payload.postback &&
    typeof payload.postback === "object" &&
    !Array.isArray(payload.postback) &&
    "referral" in payload.postback &&
    payload.postback.referral &&
    typeof payload.postback.referral === "object" &&
    !Array.isArray(payload.postback.referral)
      ? getStringValue(
          (payload.postback.referral as Record<string, unknown>).ref,
        )
      : null;

  return postbackReferral;
}

function buildEventName(payload: Record<string, unknown>): string {
  if ("message" in payload) {
    return "message";
  }

  if ("postback" in payload) {
    return "postback";
  }

  if ("delivery" in payload) {
    return "delivery";
  }

  if ("read" in payload) {
    return "read";
  }

  return "unsupported";
}

function parseMessagingItem(input: {
  entryId: string | null;
  payload: unknown;
}): ParsedMessengerEvent | null {
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    return null;
  }

  const payload = input.payload as Record<string, unknown>;
  const senderPsid =
    payload.sender &&
    typeof payload.sender === "object" &&
    !Array.isArray(payload.sender)
      ? getStringValue((payload.sender as Record<string, unknown>).id)
      : null;
  const recipientId =
    payload.recipient &&
    typeof payload.recipient === "object" &&
    !Array.isArray(payload.recipient)
      ? getStringValue((payload.recipient as Record<string, unknown>).id)
      : null;
  const pageId = recipientId ?? input.entryId;

  if (!senderPsid || !pageId) {
    return null;
  }

  const eventName = buildEventName(payload);
  const referralRef = getReferralRef(payload);
  const message =
    payload.message &&
    typeof payload.message === "object" &&
    !Array.isArray(payload.message)
      ? (payload.message as Record<string, unknown>)
      : null;
  const messageText = message ? getStringValue(message.text) : null;
  const messageId = message ? getStringValue(message.mid) : null;
  const isEcho = message?.is_echo === true;
  const sentAt = getMessageTimestampIso(payload.timestamp);
  const fallbackMessageId = `synthetic_${pageId}_${senderPsid}_${new Date(sentAt).getTime()}`;
  const resolvedMessageId = messageId ?? fallbackMessageId;
  const eventKey = `messenger:${pageId}:${resolvedMessageId}`;

  if (!message) {
    return {
      eventKey,
      eventName,
      isInboundMessage: false,
      messageId: resolvedMessageId,
      messageText,
      pageId,
      rawPayload: payload,
      recipientId,
      referralRef,
      senderPsid,
      sentAt,
      status: "ignored",
      statusReason: "Webhook event does not contain an inbound message payload.",
    };
  }

  if (isEcho || senderPsid === pageId) {
    return {
      eventKey,
      eventName,
      isInboundMessage: false,
      messageId: resolvedMessageId,
      messageText,
      pageId,
      rawPayload: payload,
      recipientId,
      referralRef,
      senderPsid,
      sentAt,
      status: "ignored",
      statusReason: "Outbound echo events are not stored as inbound messages.",
    };
  }

  return {
    eventKey,
    eventName,
    isInboundMessage: true,
    messageId: resolvedMessageId,
    messageText,
    pageId,
    rawPayload: payload,
    recipientId,
    referralRef,
    senderPsid,
    sentAt,
    status: "received",
  };
}

async function resolveWebhookContext(
  pageId: string,
): Promise<ResolvedWebhookContext | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: exactMatches } = await adminSupabase
    .from("facebook_connections")
    .select("id, dealership_id, page_id")
    .eq("page_id", pageId)
    .limit(2);

  if (exactMatches && exactMatches.length === 1) {
    return {
      dealershipId: exactMatches[0].dealership_id,
      facebookConnectionId: exactMatches[0].id,
      pageId,
    };
  }

  const configuredPageId = process.env.META_PAGE_ID?.trim() || null;

  if (configuredPageId && configuredPageId === pageId) {
    const { data: fallbackMatches } = await adminSupabase
      .from("facebook_connections")
      .select("id, dealership_id")
      .limit(2);

    if (fallbackMatches && fallbackMatches.length === 1) {
      return {
        dealershipId: fallbackMatches[0].dealership_id,
        facebookConnectionId: fallbackMatches[0].id,
        pageId,
      };
    }
  }

  return null;
}

async function createFacebookApiLog(input: {
  dealershipId: string;
  errorMessage?: string | null;
  requestPayload: unknown;
  responsePayload: unknown;
  status: "error" | "success";
  statusCode: number;
}): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();
  const payload: FacebookApiLogInsert = {
    action: "messenger_webhook_received",
    created_by: null,
    dealership_id: input.dealershipId,
    endpoint: WEBHOOK_ENDPOINT,
    error_message: input.errorMessage ?? null,
    request_payload: sanitizeFacebookRequestPayload({
      payload: input.requestPayload,
    }) as Json,
    response_payload: sanitizeFacebookResponsePayload(
      input.responsePayload,
    ) as Json,
    status: input.status,
    status_code: input.statusCode,
  };

  await adminSupabase.from("facebook_api_logs").insert(payload);
}

async function upsertWebhookEvent(input: {
  context: ResolvedWebhookContext;
  parsedEvent: ParsedMessengerEvent;
}): Promise<string | null> {
  const adminSupabase = createSupabaseAdminClient();
  const payload: FacebookWebhookEventInsert = {
    dealership_id: input.context.dealershipId,
    error_message: null,
    event_key: input.parsedEvent.eventKey,
    event_name: input.parsedEvent.eventName,
    event_source: "messenger",
    facebook_connection_id: input.context.facebookConnectionId,
    metadata: {
      referral_ref: input.parsedEvent.referralRef,
    } satisfies Json,
    object_type: "page",
    page_id: input.context.pageId,
    raw_payload: input.parsedEvent.rawPayload as Json,
    recipient_id: input.parsedEvent.recipientId,
    sender_psid: input.parsedEvent.senderPsid,
    status: input.parsedEvent.status,
  };
  const { data, error } = await adminSupabase
    .from("facebook_webhook_events")
    .upsert(payload, {
      onConflict: "dealership_id,event_key",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return null;
  }

  return data.id;
}

async function updateWebhookEventStatus(input: {
  errorMessage?: string | null;
  status: "error" | "ignored" | "processed";
  webhookEventId: string;
}): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();

  await adminSupabase
    .from("facebook_webhook_events")
    .update({
      error_message: input.errorMessage ?? null,
      processed_at: new Date().toISOString(),
      status: input.status,
    })
    .eq("id", input.webhookEventId);
}

async function upsertConversation(input: {
  context: ResolvedWebhookContext;
  messageText: string | null;
  parsedEvent: ParsedMessengerEvent;
  vehicleContext: ResolvedVehicleContext;
}): Promise<MessengerConversation | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: existingConversation } = await adminSupabase
    .from("messenger_conversations")
    .select(
      "id, customer_id, inquiry_id, metadata, referral_ref, sender_id, status, vehicle_id, vehicle_slug",
    )
    .eq("dealership_id", input.context.dealershipId)
    .eq("page_id", input.context.pageId)
    .eq("sender_psid", input.parsedEvent.senderPsid)
    .maybeSingle<
      Pick<
        MessengerConversation,
        | "customer_id"
        | "id"
        | "inquiry_id"
        | "metadata"
        | "referral_ref"
        | "sender_id"
        | "status"
        | "vehicle_id"
        | "vehicle_slug"
      >
    >();
  const existingMetadata =
    existingConversation?.metadata &&
    typeof existingConversation.metadata === "object" &&
    !Array.isArray(existingConversation.metadata)
      ? (existingConversation.metadata as Record<string, unknown>)
      : {};
  const payload: MessengerConversationInsert = {
    customer_id: existingConversation?.customer_id ?? null,
    dealership_id: input.context.dealershipId,
    facebook_connection_id: input.context.facebookConnectionId,
    inquiry_id: existingConversation?.inquiry_id ?? null,
    last_message: input.messageText,
    last_message_at: input.parsedEvent.sentAt,
    last_message_preview: input.messageText,
    metadata: {
      last_message_id: input.parsedEvent.messageId,
      referral_ref:
        input.vehicleContext.vehicleRef ??
        (typeof existingMetadata.referral_ref === "string"
          ? existingMetadata.referral_ref
          : null),
      resolved_vehicle_id:
        input.vehicleContext.vehicleId ??
        (typeof existingMetadata.resolved_vehicle_id === "string"
          ? existingMetadata.resolved_vehicle_id
          : null),
      resolved_vehicle_slug:
        input.vehicleContext.vehicleSlug ??
        (typeof existingMetadata.resolved_vehicle_slug === "string"
          ? existingMetadata.resolved_vehicle_slug
          : null),
    } satisfies Json,
    page_id: input.context.pageId,
    referral_ref:
      input.vehicleContext.vehicleRef ??
      existingConversation?.referral_ref ??
      null,
    sender_id:
      existingConversation?.sender_id ??
      input.parsedEvent.senderPsid,
    sender_psid: input.parsedEvent.senderPsid,
    status:
      existingConversation?.status === "converted"
        ? "converted"
        : existingConversation?.status ?? "new",
    vehicle_id:
      input.vehicleContext.vehicleId ??
      existingConversation?.vehicle_id ??
      null,
    vehicle_slug:
      input.vehicleContext.vehicleSlug ??
      existingConversation?.vehicle_slug ??
      null,
  };
  const { data, error } = await adminSupabase
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

async function insertMessage(input: {
  context: ResolvedWebhookContext;
  conversationId: string;
  parsedEvent: ParsedMessengerEvent;
  vehicleContext: ResolvedVehicleContext;
}): Promise<"created" | "duplicate" | "error"> {
  const adminSupabase = createSupabaseAdminClient();
  const payload: MessengerMessageInsert = {
    conversation_id: input.conversationId,
    dealership_id: input.context.dealershipId,
    direction: "inbound",
    facebook_connection_id: input.context.facebookConnectionId,
    facebook_message_id: input.parsedEvent.messageId,
    message_text: input.parsedEvent.messageText,
    metadata: {
      referral_ref: input.vehicleContext.vehicleRef,
      resolved_vehicle_id: input.vehicleContext.vehicleId,
      resolved_vehicle_slug: input.vehicleContext.vehicleSlug,
    } satisfies Json,
    page_id: input.context.pageId,
    raw_payload: input.parsedEvent.rawPayload as Json,
    sender_psid: input.parsedEvent.senderPsid,
    sent_at: input.parsedEvent.sentAt,
  };
  const { error } = await adminSupabase.from("messenger_messages").insert(payload);

  if (!error) {
    return "created";
  }

  return error.code === "23505" ? "duplicate" : "error";
}

async function createLeadSourceEvent(input: {
  context: ResolvedWebhookContext;
  parsedEvent: ParsedMessengerEvent;
  vehicleContext: ResolvedVehicleContext;
}): Promise<boolean> {
  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase.from("lead_source_events").insert({
    customer_id: null,
    dealership_id: input.context.dealershipId,
    event_name: "messenger_message_received",
    external_reference_id: input.parsedEvent.messageId,
    inquiry_id: null,
    metadata: {
      message_id: input.parsedEvent.messageId,
      page: "messenger_webhook",
      page_id: input.context.pageId,
      referral_ref: input.vehicleContext.vehicleRef,
      resolved_vehicle_id: input.vehicleContext.vehicleId,
      resolved_vehicle_slug: input.vehicleContext.vehicleSlug,
      sender_psid: input.parsedEvent.senderPsid,
    } satisfies Json,
    source_detail: MESSENGER_SOURCE_DETAIL,
    source_type: "facebook_messenger",
    vehicle_id: input.vehicleContext.vehicleId,
  });

  return !error;
}

export async function GET(request: Request): Promise<Response> {
  if (!hasFacebookWebhookVerifyToken()) {
    return new Response("Webhook verify token is not configured.", {
      status: 500,
    });
  }

  const requestUrl = new URL(request.url);
  const parsed = facebookWebhookVerificationSchema.safeParse({
    challenge: requestUrl.searchParams.get("hub.challenge") ?? "",
    mode: requestUrl.searchParams.get("hub.mode") ?? "",
    token: requestUrl.searchParams.get("hub.verify_token") ?? "",
  });

  if (!parsed.success) {
    return new Response("Invalid webhook verification request.", {
      status: 400,
    });
  }

  if (
    parsed.data.mode !== "subscribe" ||
    parsed.data.token !== getFacebookWebhookVerifyToken()
  ) {
    return new Response("Webhook verification failed.", {
      status: 403,
    });
  }

  return new Response(parsed.data.challenge, {
    status: 200,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  let rawBody: unknown;

  try {
    rawBody = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON payload.",
      },
      {
        status: 400,
      },
    );
  }

  const parsedPayload = facebookMessengerWebhookPayloadSchema.safeParse(rawBody);

  if (!parsedPayload.success || parsedPayload.data.object !== "page") {
    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 200,
      },
    );
  }

  const processingResults: Array<{
    dealershipId: string;
    eventKey: string;
    status: "error" | "ignored" | "processed";
    summary: string;
  }> = [];

  for (const entry of parsedPayload.data.entry) {
    const entryId = getStringValue(entry.id);

    for (const messagingItem of entry.messaging ?? []) {
      const parsedEvent = parseMessagingItem({
        entryId,
        payload: messagingItem,
      });

      if (!parsedEvent) {
        continue;
      }

      const context = await resolveWebhookContext(parsedEvent.pageId);

      if (!context) {
        continue;
      }

      const webhookEventId = await upsertWebhookEvent({
        context,
        parsedEvent,
      });

      if (!webhookEventId) {
        await createFacebookApiLog({
          dealershipId: context.dealershipId,
          errorMessage: "Webhook event could not be stored.",
          requestPayload: parsedEvent.rawPayload,
          responsePayload: {
            eventKey: parsedEvent.eventKey,
          },
          status: "error",
          statusCode: 500,
        });
        processingResults.push({
          dealershipId: context.dealershipId,
          eventKey: parsedEvent.eventKey,
          status: "error",
          summary: "Webhook event could not be stored.",
        });
        continue;
      }

      const vehicleContext = await resolveMessengerVehicleContext({
        adminSupabase: createSupabaseAdminClient(),
        dealershipId: context.dealershipId,
        messageText: parsedEvent.messageText,
        referralRef: parsedEvent.referralRef,
      });

      if (!parsedEvent.isInboundMessage) {
        await updateWebhookEventStatus({
          errorMessage: parsedEvent.statusReason ?? null,
          status: "ignored",
          webhookEventId,
        });
        await createFacebookApiLog({
          dealershipId: context.dealershipId,
          errorMessage: parsedEvent.statusReason ?? null,
          requestPayload: parsedEvent.rawPayload,
          responsePayload: {
            eventKey: parsedEvent.eventKey,
            eventName: parsedEvent.eventName,
            status: "ignored",
          },
          status: "success",
          statusCode: 200,
        });
        processingResults.push({
          dealershipId: context.dealershipId,
          eventKey: parsedEvent.eventKey,
          status: "ignored",
          summary: parsedEvent.statusReason ?? "Ignored non-message webhook event.",
        });
        continue;
      }

      const conversation = await upsertConversation({
        context,
        messageText: parsedEvent.messageText,
        parsedEvent,
        vehicleContext,
      });

      if (!conversation) {
        const errorMessage = "Conversation could not be created.";

        await updateWebhookEventStatus({
          errorMessage,
          status: "error",
          webhookEventId,
        });
        await createFacebookApiLog({
          dealershipId: context.dealershipId,
          errorMessage,
          requestPayload: parsedEvent.rawPayload,
          responsePayload: {
            eventKey: parsedEvent.eventKey,
            status: "error",
          },
          status: "error",
          statusCode: 500,
        });
        processingResults.push({
          dealershipId: context.dealershipId,
          eventKey: parsedEvent.eventKey,
          status: "error",
          summary: errorMessage,
        });
        continue;
      }

      const messageInsertState = await insertMessage({
        context,
        conversationId: conversation.id,
        parsedEvent,
        vehicleContext,
      });

      if (messageInsertState === "error") {
        const errorMessage = "Messenger message could not be stored.";

        await updateWebhookEventStatus({
          errorMessage,
          status: "error",
          webhookEventId,
        });
        await createFacebookApiLog({
          dealershipId: context.dealershipId,
          errorMessage,
          requestPayload: parsedEvent.rawPayload,
          responsePayload: {
            eventKey: parsedEvent.eventKey,
            messageId: parsedEvent.messageId,
            status: "error",
          },
          status: "error",
          statusCode: 500,
        });
        processingResults.push({
          dealershipId: context.dealershipId,
          eventKey: parsedEvent.eventKey,
          status: "error",
          summary: errorMessage,
        });
        continue;
      }

      if (messageInsertState === "created") {
        const leadSourceCreated = await createLeadSourceEvent({
          context,
          parsedEvent,
          vehicleContext,
        });

        if (!leadSourceCreated) {
          const errorMessage = "Lead source event could not be created.";

          await updateWebhookEventStatus({
            errorMessage,
            status: "error",
            webhookEventId,
          });
          await createFacebookApiLog({
            dealershipId: context.dealershipId,
            errorMessage,
            requestPayload: parsedEvent.rawPayload,
            responsePayload: {
              eventKey: parsedEvent.eventKey,
              messageId: parsedEvent.messageId,
              status: "error",
            },
            status: "error",
            statusCode: 500,
          });
          processingResults.push({
            dealershipId: context.dealershipId,
            eventKey: parsedEvent.eventKey,
            status: "error",
            summary: errorMessage,
          });
          continue;
        }
      }

      await updateWebhookEventStatus({
        errorMessage:
          messageInsertState === "duplicate"
            ? "Duplicate Messenger message ignored."
            : null,
        status: "processed",
        webhookEventId,
      });
      await createFacebookApiLog({
        dealershipId: context.dealershipId,
        errorMessage: null,
        requestPayload: parsedEvent.rawPayload,
        responsePayload: {
          conversationId: conversation.id,
          eventKey: parsedEvent.eventKey,
          messageId: parsedEvent.messageId,
          messageInsertState,
          status: "processed",
        },
        status: "success",
        statusCode: 200,
      });
      processingResults.push({
        dealershipId: context.dealershipId,
        eventKey: parsedEvent.eventKey,
        status: "processed",
        summary:
          messageInsertState === "duplicate"
            ? "Duplicate Messenger message ignored."
            : "Messenger message stored.",
      });
    }
  }

  return NextResponse.json(
    {
      processed: processingResults.length,
      received: true,
    },
    {
      status: 200,
    },
  );
}
