import "server-only";

import {
  createMetaAppSecretProof,
  getFacebookGraphApiEnv,
  hasFacebookPublishingAccessToken,
  sanitizeFacebookResponsePayload,
} from "@/lib/facebook/server";

export type FacebookGraphMessengerMessage = {
  conversationThreadId: string;
  createdTime: string;
  messageId: string;
  messageText: string;
  senderFacebookId: string;
  senderName: string;
};

type GraphMessengerFrom = {
  id?: string;
  name?: string;
};

type GraphMessengerMessageNode = {
  created_time?: string;
  from?: GraphMessengerFrom;
  id?: string;
  message?: string;
};

type GraphMessengerConversationNode = {
  id?: string;
  messages?: {
    data?: GraphMessengerMessageNode[];
    paging?: {
      next?: string;
    };
  };
};

type GraphMessengerConversationsResponse = {
  data?: GraphMessengerConversationNode[];
  error?: {
    message?: string;
  };
  paging?: {
    next?: string;
  };
};

type GraphMessengerMessagesResponse = {
  data?: GraphMessengerMessageNode[];
  error?: {
    message?: string;
  };
  paging?: {
    next?: string;
  };
};

const CONVERSATION_FIELDS = "id,messages{id,message,from,created_time}";
const MAX_CONVERSATION_PAGES = 3;
const MAX_MESSAGE_PAGES_PER_CONVERSATION = 3;

function getStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toIsoDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

async function fetchGraphJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    next: {
      revalidate: 0,
    },
  });
  const responseText = await response.text();

  let payload: T;

  try {
    payload = JSON.parse(responseText) as T;
  } catch {
    throw new Error("facebook_graph_invalid_json");
  }

  const errorPayload = payload as { error?: { message?: string } };

  if (!response.ok || errorPayload.error?.message) {
    throw new Error(errorPayload.error?.message ?? "facebook_graph_request_failed");
  }

  return payload;
}

function mapMessageNode(input: {
  conversationThreadId: string;
  node: GraphMessengerMessageNode;
  pageId: string;
}): FacebookGraphMessengerMessage | null {
  const messageId = getStringValue(input.node.id);
  const messageText = getStringValue(input.node.message)?.trim() ?? "";
  const senderFacebookId = getStringValue(input.node.from?.id);
  const senderName = getStringValue(input.node.from?.name);
  const createdTime = toIsoDateTime(getStringValue(input.node.created_time));

  if (!messageId || !messageText || !senderFacebookId || !senderName || !createdTime) {
    return null;
  }

  if (senderFacebookId === input.pageId) {
    return null;
  }

  return {
    conversationThreadId: input.conversationThreadId,
    createdTime,
    messageId,
    messageText,
    senderFacebookId,
    senderName,
  };
}

async function fetchMessagesForConversation(input: {
  conversationThreadId: string;
  initialMessages: GraphMessengerMessageNode[];
  initialNextUrl: string | null;
  pageId: string;
}): Promise<FacebookGraphMessengerMessage[]> {
  const messages: FacebookGraphMessengerMessage[] = [];
  let messageNodes = input.initialMessages;
  let nextMessageUrl = input.initialNextUrl;
  let messagePageCount = 0;

  while (messagePageCount < MAX_MESSAGE_PAGES_PER_CONVERSATION) {
    for (const node of messageNodes) {
      const mapped = mapMessageNode({
        conversationThreadId: input.conversationThreadId,
        node,
        pageId: input.pageId,
      });

      if (mapped) {
        messages.push(mapped);
      }
    }

    if (!nextMessageUrl) {
      break;
    }

    const payload = await fetchGraphJson<GraphMessengerMessagesResponse>(nextMessageUrl);
    messageNodes = payload.data ?? [];
    nextMessageUrl = payload.paging?.next ?? null;
    messagePageCount += 1;
  }

  return messages;
}

export function hasFacebookMessengerSyncAccess(): boolean {
  return hasFacebookPublishingAccessToken() && Boolean(process.env.META_APP_SECRET?.trim());
}

export async function fetchFacebookPageConversations(input: {
  pageId: string;
}): Promise<FacebookGraphMessengerMessage[]> {
  if (!hasFacebookMessengerSyncAccess()) {
    throw new Error("facebook_messenger_sync_not_configured");
  }

  const env = getFacebookGraphApiEnv();
  const appsecretProof = createMetaAppSecretProof(env.META_PAGE_ACCESS_TOKEN);
  const messages: FacebookGraphMessengerMessage[] = [];
  let nextConversationUrl: string | null =
    `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${input.pageId}/conversations?` +
    new URLSearchParams({
      access_token: env.META_PAGE_ACCESS_TOKEN,
      appsecret_proof: appsecretProof,
      fields: CONVERSATION_FIELDS,
      limit: "25",
    }).toString();
  let conversationPageCount = 0;

  while (nextConversationUrl && conversationPageCount < MAX_CONVERSATION_PAGES) {
    const payload: GraphMessengerConversationsResponse =
      await fetchGraphJson<GraphMessengerConversationsResponse>(nextConversationUrl);

    for (const conversation of payload.data ?? []) {
      const conversationThreadId = getStringValue(conversation.id);

      if (!conversationThreadId) {
        continue;
      }

      const conversationMessages = await fetchMessagesForConversation({
        conversationThreadId,
        initialMessages: conversation.messages?.data ?? [],
        initialNextUrl: conversation.messages?.paging?.next ?? null,
        pageId: input.pageId,
      });

      messages.push(...conversationMessages);
    }

    nextConversationUrl = payload.paging?.next ?? null;
    conversationPageCount += 1;
  }

  return messages.sort(
    (left, right) => new Date(left.createdTime).getTime() - new Date(right.createdTime).getTime(),
  );
}

export function sanitizeFacebookGraphMessengerMessagesForLog(
  messages: FacebookGraphMessengerMessage[],
): unknown {
  return sanitizeFacebookResponsePayload(
    messages.map((message) => ({
      conversation_thread_id: message.conversationThreadId,
      created_time: message.createdTime,
      message_id: message.messageId,
      message_text: message.messageText,
      sender_facebook_id: message.senderFacebookId,
      sender_name: message.senderName,
    })),
  );
}
