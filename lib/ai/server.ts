import "server-only";

import type { DealershipAiContext } from "@/features/ai/types";
import {
  buildAiSalesAnalystUserPrompt,
  getAiSalesAnalystSystemPrompt,
} from "@/features/ai/prompts";

const OPENAI_RESPONSES_API_URL = "https://api.openai.com/v1/responses";
const AI_SALES_ANALYST_MODEL = "gpt-5.5";

type ConversationTurn = {
  content: string;
  role: "assistant" | "user";
};

type ResponsesApiOutputItem = {
  content?: Array<{
    text?: string;
    type?: string;
  }>;
  type?: string;
};

type ResponsesApiResponse = {
  error?: {
    message?: string;
  } | null;
  output?: ResponsesApiOutputItem[];
  output_text?: string;
};

export type AiProviderResult = {
  answer: string;
};

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function extractResponseText(payload: ResponsesApiResponse): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const contentText = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (contentText) {
    return contentText;
  }

  return "";
}

function getProviderErrorMessage(status: number, detail?: string): string {
  if (status === 401 || status === 403) {
    return "The AI provider rejected the request. Check the OpenAI API key.";
  }

  if (status === 429) {
    return "The AI provider is rate limiting requests right now. Try again shortly.";
  }

  if (detail && detail.length <= 160) {
    return detail;
  }

  return "The AI provider could not complete the request.";
}

export async function askOpenAiSalesAnalyst(input: {
  context: DealershipAiContext;
  conversation: ConversationTurn[];
  question: string;
}): Promise<AiProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const response = await fetch(OPENAI_RESPONSES_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: [
          {
            content: getAiSalesAnalystSystemPrompt(),
            role: "developer",
          },
          ...input.conversation.map((message) => ({
            content: message.content,
            role: message.role,
          })),
          {
            content: buildAiSalesAnalystUserPrompt({
              context: input.context,
              question: input.question,
            }),
            role: "user",
          },
        ],
        max_output_tokens: 900,
        model: AI_SALES_ANALYST_MODEL,
        reasoning: {
          effort: "low",
        },
        text: {
          verbosity: "low",
        },
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as ResponsesApiResponse;

    if (!response.ok) {
      throw new Error(
        getProviderErrorMessage(
          response.status,
          payload.error?.message,
        ),
      );
    }

    const answer = extractResponseText(payload);

    if (!answer) {
      throw new Error("The AI provider returned an empty response.");
    }

    return {
      answer,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The AI request timed out. Try a shorter or more specific question.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("The AI provider is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
}
