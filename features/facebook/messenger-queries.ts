import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessContext } from "@/lib/auth/types";
import type { Customer } from "@/features/customers/types";
import type { Inquiry } from "@/features/inquiries/types";
import type { Vehicle } from "@/features/vehicles/types";
import type {
  FacebookMessengerConversationRecord,
  FacebookMessengerInboxResult,
  FacebookMessengerMessageRecord,
  MessengerConversation,
  MessengerConversationLookupResult,
  MessengerMessage,
} from "@/features/facebook/types";
import { facebookMessengerInboxFiltersSchema } from "@/features/facebook/validators";

type MessengerConversationFiltersInput = {
  q?: string | string[];
  status?: string | string[];
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getResolvedVehicleId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>).resolved_vehicle_id;

  return typeof value === "string" ? value : null;
}

function getVehicleIdForConversation(conversation: MessengerConversation): string | null {
  return conversation.vehicle_id ?? getResolvedVehicleId(conversation.metadata);
}

function getVehicleIdForMessage(message: MessengerMessage): string | null {
  return getResolvedVehicleId(message.metadata);
}

function filterConversations(
  conversations: MessengerConversation[],
  input: FacebookMessengerInboxResult["filters"],
): MessengerConversation[] {
  const normalizedQuery = input.q.toLowerCase();

  return conversations.filter((conversation) => {
    const statusMatches =
      input.status === "all" || conversation.status === input.status;

    if (!statusMatches) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      conversation.sender_id,
      conversation.sender_psid,
      conversation.last_message,
      conversation.last_message_preview,
      conversation.referral_ref,
      conversation.vehicle_slug,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

async function mapConversationRelations(
  access: AdminAccessContext,
  conversations: MessengerConversation[],
): Promise<FacebookMessengerConversationRecord[]> {
  if (conversations.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const customerIds = Array.from(
    new Set(
      conversations
        .map((conversation) => conversation.customer_id)
        .filter((customerId): customerId is string => Boolean(customerId)),
    ),
  );
  const inquiryIds = Array.from(
    new Set(
      conversations
        .map((conversation) => conversation.inquiry_id)
        .filter((inquiryId): inquiryId is string => Boolean(inquiryId)),
    ),
  );
  const vehicleIds = Array.from(
    new Set(
      conversations
        .map((conversation) => getVehicleIdForConversation(conversation))
        .filter((vehicleId): vehicleId is string => Boolean(vehicleId)),
    ),
  );
  const conversationIds = conversations.map((conversation) => conversation.id);
  const [customersResponse, inquiriesResponse, vehiclesResponse, messageCountsResponse] =
    await Promise.all([
      customerIds.length > 0
        ? supabase
            .from("customers")
            .select("id, full_name, email, phone")
            .eq("dealership_id", access.dealership.id)
            .in("id", customerIds)
        : Promise.resolve({
            data: [] as Array<Pick<Customer, "email" | "full_name" | "id" | "phone">>,
          }),
      inquiryIds.length > 0
        ? supabase
            .from("inquiries")
            .select("id, status, created_at")
            .eq("dealership_id", access.dealership.id)
            .in("id", inquiryIds)
        : Promise.resolve({
            data: [] as Array<Pick<Inquiry, "created_at" | "id" | "status">>,
          }),
      vehicleIds.length > 0
        ? supabase
            .from("vehicles")
            .select("id, slug, title")
            .eq("dealership_id", access.dealership.id)
            .in("id", vehicleIds)
        : Promise.resolve({
            data: [] as Array<Pick<Vehicle, "id" | "slug" | "title">>,
          }),
      supabase
        .from("messenger_messages")
        .select("conversation_id")
        .eq("dealership_id", access.dealership.id)
        .in("conversation_id", conversationIds),
    ]);

  const customersById = new Map(
    (customersResponse.data ?? []).map((customer) => [customer.id, customer]),
  );
  const inquiriesById = new Map(
    (inquiriesResponse.data ?? []).map((inquiry) => [inquiry.id, inquiry]),
  );
  const vehiclesById = new Map(
    (vehiclesResponse.data ?? []).map((vehicle) => [vehicle.id, vehicle]),
  );
  const messageCountByConversationId = new Map<string, number>();

  for (const row of messageCountsResponse.data ?? []) {
    messageCountByConversationId.set(
      row.conversation_id,
      (messageCountByConversationId.get(row.conversation_id) ?? 0) + 1,
    );
  }

  return conversations.map((conversation) => ({
    ...conversation,
    linkedCustomer: conversation.customer_id
      ? customersById.get(conversation.customer_id) ?? null
      : null,
    linkedInquiry: conversation.inquiry_id
      ? inquiriesById.get(conversation.inquiry_id) ?? null
      : null,
    messageCount: messageCountByConversationId.get(conversation.id) ?? 0,
    resolvedVehicle:
      vehiclesById.get(getVehicleIdForConversation(conversation) ?? "") ?? null,
  }));
}

async function mapMessageRelations(
  access: AdminAccessContext,
  messages: MessengerMessage[],
): Promise<FacebookMessengerMessageRecord[]> {
  if (messages.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const vehicleIds = Array.from(
    new Set(
      messages
        .map((message) => getVehicleIdForMessage(message))
        .filter((vehicleId): vehicleId is string => Boolean(vehicleId)),
    ),
  );
  const { data: vehicles } =
    vehicleIds.length > 0
      ? await supabase
          .from("vehicles")
          .select("id, slug, title")
          .eq("dealership_id", access.dealership.id)
          .in("id", vehicleIds)
      : { data: [] as Array<Pick<Vehicle, "id" | "slug" | "title">> };

  const vehiclesById = new Map((vehicles ?? []).map((vehicle) => [vehicle.id, vehicle]));

  return messages.map((message) => ({
    ...message,
    resolvedVehicle:
      vehiclesById.get(getVehicleIdForMessage(message) ?? "") ?? null,
  }));
}

export function parseMessengerConversationFilters(
  searchParams: MessengerConversationFiltersInput,
): FacebookMessengerInboxResult["filters"] {
  return facebookMessengerInboxFiltersSchema.parse({
    q: getScalarValue(searchParams.q),
    status: getScalarValue(searchParams.status),
  });
}

export async function getMessengerConversations(
  access: AdminAccessContext,
  searchParams: MessengerConversationFiltersInput,
): Promise<FacebookMessengerInboxResult> {
  const filters = parseMessengerConversationFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  const [conversationsResponse, conversationCountResponse, messageCountResponse, webhookCountResponse] =
    await Promise.all([
      supabase
        .from("messenger_conversations")
        .select("*")
        .eq("dealership_id", access.dealership.id)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(100),
      supabase
        .from("messenger_conversations")
        .select("id", { count: "exact", head: true })
        .eq("dealership_id", access.dealership.id),
      supabase
        .from("messenger_messages")
        .select("id", { count: "exact", head: true })
        .eq("dealership_id", access.dealership.id),
      supabase
        .from("facebook_webhook_events")
        .select("id", { count: "exact", head: true })
        .eq("dealership_id", access.dealership.id)
        .eq("event_source", "messenger"),
    ]);

  const filteredConversations = filterConversations(
    (conversationsResponse.data ?? []) as MessengerConversation[],
    filters,
  );
  const conversations = await mapConversationRelations(access, filteredConversations);

  return {
    conversations,
    filters,
    latestReceivedAt: conversations[0]?.last_message_at ?? null,
    totalConversationCount: conversationCountResponse.count ?? 0,
    totalMessageCount: messageCountResponse.count ?? 0,
    totalWebhookEventCount: webhookCountResponse.count ?? 0,
  };
}

export async function getMessengerConversationDetail(
  access: AdminAccessContext,
  conversationId: string,
): Promise<MessengerConversationLookupResult> {
  const supabase = await createSupabaseServerClient();
  const { data: conversation, error } = await supabase
    .from("messenger_conversations")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", conversationId)
    .maybeSingle<MessengerConversation>();

  if (error) {
    return { type: "not_found" };
  }

  if (!conversation) {
    const adminSupabase = createSupabaseAdminClient();
    const { data: existingConversation } = await adminSupabase
      .from("messenger_conversations")
      .select("id, dealership_id")
      .eq("id", conversationId)
      .maybeSingle<Pick<MessengerConversation, "dealership_id" | "id">>();

    if (
      existingConversation &&
      existingConversation.dealership_id !== access.dealership.id
    ) {
      return { type: "forbidden" };
    }

    return { type: "not_found" };
  }

  const { data: messages } = await supabase
    .from("messenger_messages")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("conversation_id", conversation.id)
    .order("sent_at", { ascending: true })
    .limit(200);
  const [conversationRecord] = await mapConversationRelations(access, [conversation]);
  const mappedMessages = await mapMessageRelations(
    access,
    (messages ?? []) as MessengerMessage[],
  );

  return {
    record: {
      conversation: conversationRecord,
      messages: mappedMessages,
    },
    type: "ok",
  };
}
