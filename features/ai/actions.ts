"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { buildAiContextSummary, getDealershipAiContext } from "@/features/ai/data-context";
import {
  AI_SALES_ANALYST_SUGGESTED_QUESTIONS,
} from "@/features/ai/prompts";
import type {
  AiAskResponse,
  AiChatMessageRecord,
  AiChatSession,
  AiChatSessionListItem,
  AiContextSummary,
  DealershipAiContext,
} from "@/features/ai/types";
import {
  aiChatSessionSchema,
  aiContextSummarySchema,
  askAiSalesAnalystSchema,
} from "@/features/ai/validators";
import { canUseAiSalesAnalyst } from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import { askOpenAiSalesAnalyst, hasOpenAiApiKey } from "@/lib/ai/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

const sessionLookupSchema = z.object({
  sessionId: z.string().uuid("Select a valid AI chat session."),
});

function buildSessionTitle(question: string): string {
  const trimmed = question.trim().replace(/\s+/g, " ");

  if (trimmed.length <= 72) {
    return trimmed;
  }

  return `${trimmed.slice(0, 69)}...`;
}

function truncatePreview(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length <= 120) {
    return trimmed;
  }

  return `${trimmed.slice(0, 117)}...`;
}

async function requireAiAccess() {
  const access = await requireAdminAccessContext("/admin/ai");

  if (!access || !canUseAiSalesAnalyst(access.membership.role)) {
    return null;
  }

  return access;
}

async function listAiSessions(
  dealershipId: string,
): Promise<AiChatSessionListItem[]> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: sessions } = await adminSupabase
    .from("ai_chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("dealership_id", dealershipId)
    .order("updated_at", { ascending: false })
    .limit(12);

  const typedSessions = (sessions ?? []) as Array<
    Pick<AiChatSession, "created_at" | "id" | "title" | "updated_at">
  >;

  if (typedSessions.length === 0) {
    return [];
  }

  const sessionIds = typedSessions.map((session) => session.id);
  const { data: messages } = await adminSupabase
    .from("ai_chat_messages")
    .select("session_id, content, created_at")
    .eq("dealership_id", dealershipId)
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  const messageCountBySessionId = new Map<string, number>();
  const previewBySessionId = new Map<string, string | null>();

  for (const message of messages ?? []) {
    messageCountBySessionId.set(
      message.session_id,
      (messageCountBySessionId.get(message.session_id) ?? 0) + 1,
    );

    if (!previewBySessionId.has(message.session_id)) {
      previewBySessionId.set(
        message.session_id,
        truncatePreview(message.content),
      );
    }
  }

  return typedSessions.map((session) => ({
    ...session,
    lastMessagePreview: previewBySessionId.get(session.id) ?? null,
    messageCount: messageCountBySessionId.get(session.id) ?? 0,
  }));
}

async function getSessionMessagesRecord(input: {
  dealershipId: string;
  sessionId: string;
}): Promise<AiChatMessageRecord[]> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: messages } = await adminSupabase
    .from("ai_chat_messages")
    .select("id, role, content, metadata, created_at")
    .eq("dealership_id", input.dealershipId)
    .eq("session_id", input.sessionId)
    .order("created_at", { ascending: true });

  return (messages ?? []) as AiChatMessageRecord[];
}

async function getConversationHistoryForModel(input: {
  dealershipId: string;
  sessionId: string;
}): Promise<Array<{ content: string; role: "assistant" | "user" }>> {
  const messages = await getSessionMessagesRecord(input);

  return messages
    .filter(
      (
        message,
      ): message is AiChatMessageRecord & { role: "assistant" | "user" } =>
        message.role === "assistant" || message.role === "user",
    )
    .slice(-8)
    .map((message) => ({
      content: message.content,
      role: message.role,
    }));
}

async function getAccessibleSession(input: {
  dealershipId: string;
  sessionId: string;
}): Promise<AiChatSession | null> {
  const adminSupabase = createSupabaseAdminClient();
  const { data: session } = await adminSupabase
    .from("ai_chat_sessions")
    .select("*")
    .eq("dealership_id", input.dealershipId)
    .eq("id", input.sessionId)
    .maybeSingle<AiChatSession>();

  return session ?? null;
}

async function insertMessage(input: {
  content: string;
  dealershipId: string;
  metadata?: Json;
  role: "assistant" | "system" | "user";
  sessionId: string;
}) {
  const adminSupabase = createSupabaseAdminClient();

  await adminSupabase.from("ai_chat_messages").insert({
    content: input.content,
    dealership_id: input.dealershipId,
    metadata: input.metadata ?? {},
    role: input.role,
    session_id: input.sessionId,
  });
}

async function touchSession(input: {
  dealershipId: string;
  sessionId: string;
  title?: string;
}) {
  const adminSupabase = createSupabaseAdminClient();
  await adminSupabase
    .from("ai_chat_sessions")
    .update({
      ...(input.title ? { title: input.title } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("dealership_id", input.dealershipId)
    .eq("id", input.sessionId);
}

export async function getAiSuggestedQuestions(): Promise<string[]> {
  return [...AI_SALES_ANALYST_SUGGESTED_QUESTIONS];
}

export async function getAiContextSummary(): Promise<{
  context: DealershipAiContext | null;
  error?: string;
  summary: AiContextSummary | null;
}> {
  const access = await requireAiAccess();

  if (!access) {
    return {
      error: "AI Sales Analyst is not available for this account.",
      summary: null,
      context: null,
    };
  }

  aiContextSummarySchema.parse({});

  try {
    const context = await getDealershipAiContext(access);

    return {
      context,
      summary: buildAiContextSummary({
        configured: hasOpenAiApiKey(),
        context,
      }),
    };
  } catch {
    return {
      error: "AI Sales Analyst could not load dealership data.",
      summary: null,
      context: null,
    };
  }
}

export async function getAiChatSessions(): Promise<AiChatSessionListItem[]> {
  const access = await requireAiAccess();

  if (!access) {
    return [];
  }

  return listAiSessions(access.dealership.id);
}

export async function getAiChatMessages(input: {
  sessionId: string;
}): Promise<{
  error?: string;
  messages: AiChatMessageRecord[];
  sessionId: string | null;
}> {
  const access = await requireAiAccess();

  if (!access) {
    return {
      error: "AI Sales Analyst is not available for this account.",
      messages: [],
      sessionId: null,
    };
  }

  const parsed = sessionLookupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Select a valid AI chat session.",
      messages: [],
      sessionId: null,
    };
  }

  const session = await getAccessibleSession({
    dealershipId: access.dealership.id,
    sessionId: parsed.data.sessionId,
  });

  if (!session) {
    return {
      error: "AI chat session not found.",
      messages: [],
      sessionId: null,
    };
  }

  return {
    messages: await getSessionMessagesRecord({
      dealershipId: access.dealership.id,
      sessionId: session.id,
    }),
    sessionId: session.id,
  };
}

export async function createAiChatSession(input?: {
  title?: string;
}): Promise<{
  error?: string;
  session: AiChatSessionListItem | null;
}> {
  const access = await requireAiAccess();

  if (!access) {
    return {
      error: "AI Sales Analyst is not available for this account.",
      session: null,
    };
  }

  const parsed = aiChatSessionSchema.safeParse({
    title: input?.title ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid session title.",
      session: null,
    };
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: session } = await adminSupabase
    .from("ai_chat_sessions")
    .insert({
      created_by: access.profile.id,
      dealership_id: access.dealership.id,
      title: parsed.data.title || "New AI session",
    })
    .select("id, title, created_at, updated_at")
    .maybeSingle<Pick<AiChatSession, "created_at" | "id" | "title" | "updated_at">>();

  if (!session) {
    return {
      error: "Unable to create an AI chat session.",
      session: null,
    };
  }

  revalidatePath("/admin/ai");

  return {
    session: {
      ...session,
      lastMessagePreview: null,
      messageCount: 0,
    },
  };
}

export async function askAiSalesAnalyst(input: {
  question: string;
  sessionId?: string | null;
}): Promise<AiAskResponse> {
  const access = await requireAiAccess();

  if (!access) {
    return {
      error: "AI Sales Analyst is not available for this account.",
      messages: [],
      sessionId: null,
      sessions: [],
      setupRequired: !hasOpenAiApiKey(),
    };
  }

  const parsed = askAiSalesAnalystSchema.safeParse({
    question: input.question,
    sessionId: input.sessionId ?? "",
  });

  if (!parsed.success) {
    const fallbackSessionId =
      typeof input.sessionId === "string" && input.sessionId ? input.sessionId : null;

    return {
      error: "Enter a valid AI question.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      messages: fallbackSessionId
        ? await getSessionMessagesRecord({
            dealershipId: access.dealership.id,
            sessionId: fallbackSessionId,
          }).catch(() => [])
        : [],
      sessionId: fallbackSessionId,
      sessions: await listAiSessions(access.dealership.id),
      setupRequired: !hasOpenAiApiKey(),
    };
  }

  if (!hasOpenAiApiKey()) {
    const fallbackSessionId = parsed.data.sessionId || null;
    const fallbackMessages = fallbackSessionId
      ? await getSessionMessagesRecord({
          dealershipId: access.dealership.id,
          sessionId: fallbackSessionId,
        }).catch(() => [])
      : [];

    return {
      error: "AI is not configured yet. Add OPENAI_API_KEY to enable AI Sales Analyst.",
      messages: fallbackMessages,
      sessionId: fallbackSessionId,
      sessions: await listAiSessions(access.dealership.id),
      setupRequired: true,
    };
  }

  let sessionId = parsed.data.sessionId || null;

  if (!sessionId) {
    const sessionResult = await createAiChatSession({
      title: buildSessionTitle(parsed.data.question),
    });

    if (!sessionResult.session) {
      return {
        error: sessionResult.error ?? "Unable to start an AI session.",
        messages: [],
        sessionId: null,
        sessions: await listAiSessions(access.dealership.id),
        setupRequired: !hasOpenAiApiKey(),
      };
    }

    sessionId = sessionResult.session.id;
  }

  const session = await getAccessibleSession({
    dealershipId: access.dealership.id,
    sessionId,
  });

  if (!session) {
    return {
      error: "AI chat session not found.",
      messages: [],
      sessionId: null,
      sessions: await listAiSessions(access.dealership.id),
      setupRequired: !hasOpenAiApiKey(),
    };
  }

  const question = parsed.data.question.trim();
  const history = await getConversationHistoryForModel({
    dealershipId: access.dealership.id,
    sessionId: session.id,
  });

  await insertMessage({
    content: question,
    dealershipId: access.dealership.id,
    metadata: {
      question_length: question.length,
    },
    role: "user",
    sessionId: session.id,
  });
  await touchSession({
    dealershipId: access.dealership.id,
    sessionId: session.id,
    title: session.title || buildSessionTitle(question),
  });

  try {
    const context = await getDealershipAiContext(access);
    const result = await askOpenAiSalesAnalyst({
      context,
      conversation: history,
      question,
    });

    await insertMessage({
      content: result.answer,
      dealershipId: access.dealership.id,
      metadata: {
        source: "openai",
      },
      role: "assistant",
      sessionId: session.id,
    });
    await touchSession({
      dealershipId: access.dealership.id,
      sessionId: session.id,
    });

    revalidatePath("/admin/ai");

    return {
      answer: result.answer,
      messages: await getSessionMessagesRecord({
        dealershipId: access.dealership.id,
        sessionId: session.id,
      }),
      sessionId: session.id,
      sessions: await listAiSessions(access.dealership.id),
      setupRequired: false,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "The AI provider could not answer right now.",
      messages: await getSessionMessagesRecord({
        dealershipId: access.dealership.id,
        sessionId: session.id,
      }),
      sessionId: session.id,
      sessions: await listAiSessions(access.dealership.id),
      setupRequired: false,
    };
  }
}
