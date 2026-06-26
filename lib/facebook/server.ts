import "server-only";

import crypto from "node:crypto";

import { z } from "zod";

const facebookPublishingEnvSchema = z.object({
  META_GRAPH_API_VERSION: z
    .string()
    .trim()
    .min(1, "META_GRAPH_API_VERSION is invalid.")
    .default("v23.0"),
  META_PAGE_ACCESS_TOKEN: z
    .string()
    .trim()
    .min(1, "META_PAGE_ACCESS_TOKEN is required."),
  META_APP_SECRET: z
    .string()
    .trim()
    .min(1, "META_APP_SECRET is required."),
  META_PAGE_ID: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .trim()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL."),
});

const facebookGraphApiEnvSchema = z.object({
  META_GRAPH_API_VERSION: z
    .string()
    .trim()
    .min(1, "META_GRAPH_API_VERSION is invalid.")
    .default("v23.0"),
  META_PAGE_ACCESS_TOKEN: z
    .string()
    .trim()
    .min(1, "META_PAGE_ACCESS_TOKEN is required."),
  META_APP_SECRET: z
    .string()
    .trim()
    .min(1, "META_APP_SECRET is required."),
});

const facebookWebhookEnvSchema = z.object({
  META_WEBHOOK_VERIFY_TOKEN: z
    .string()
    .trim()
    .min(1, "META_WEBHOOK_VERIFY_TOKEN is required."),
});

export type FacebookPublishResult = {
  errorMessage?: string;
  facebookPhotoId?: string;
  facebookPostId?: string;
  rawResponse?: unknown;
  statusCode?: number;
  success: boolean;
};

export function createMetaAppSecretProof(accessToken: string): string {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret?.trim()) {
    throw new Error("Missing META_APP_SECRET");
  }

  return crypto
    .createHmac("sha256", appSecret.trim())
    .update(accessToken.trim())
    .digest("hex");
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function sanitizePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const normalizedKey = key.toLowerCase();

      if (
        normalizedKey.includes("access_token") ||
        normalizedKey.includes("appsecret") ||
        normalizedKey.includes("token")
      ) {
        return [key, "[redacted]"];
      }

      return [key, sanitizePayload(item)];
    }),
  );
}

async function postToFacebook(input: {
  endpoint: string;
  payload: Record<string, string>;
}): Promise<FacebookPublishResult> {
  const requestBody = new URLSearchParams(input.payload);
  const response = await fetch(input.endpoint, {
    body: requestBody.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const responseText = await response.text();
  const rawResponse = safeJsonParse(responseText);

  if (!response.ok) {
    const errorMessage =
      typeof rawResponse === "object" &&
      rawResponse !== null &&
      "error" in rawResponse &&
      typeof rawResponse.error === "object" &&
      rawResponse.error !== null &&
      "message" in rawResponse.error &&
      typeof rawResponse.error.message === "string"
        ? rawResponse.error.message
        : "Facebook publishing failed.";

    return {
      errorMessage,
      rawResponse: sanitizePayload(rawResponse),
      statusCode: response.status,
      success: false,
    };
  }

  return {
    rawResponse: sanitizePayload(rawResponse),
    statusCode: response.status,
    success: true,
  };
}

export function getFacebookGraphApiEnv(): z.infer<typeof facebookGraphApiEnvSchema> {
  return facebookGraphApiEnvSchema.parse({
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN,
  });
}

export function getFacebookPublishingEnv(): z.infer<
  typeof facebookPublishingEnvSchema
> {
  return facebookPublishingEnvSchema.parse({
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN,
    META_PAGE_ID: process.env.META_PAGE_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
}

export function hasFacebookPublishingAccessToken(): boolean {
  return Boolean(process.env.META_PAGE_ACCESS_TOKEN?.trim());
}

export function hasFacebookSiteUrl(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim());
}

export function getFacebookWebhookVerifyToken(): string {
  return facebookWebhookEnvSchema.parse({
    META_WEBHOOK_VERIFY_TOKEN: process.env.META_WEBHOOK_VERIFY_TOKEN,
  }).META_WEBHOOK_VERIFY_TOKEN;
}

export function hasFacebookWebhookVerifyToken(): boolean {
  return Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN?.trim());
}

export function sanitizeFacebookRequestPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizePayload(payload) as Record<string, unknown>;
}

export function sanitizeFacebookResponsePayload(response: unknown): unknown {
  return sanitizePayload(response);
}

export async function publishPageTextPost(input: {
  caption: string;
  link: string;
  pageId: string;
}): Promise<FacebookPublishResult> {
  const env = getFacebookPublishingEnv();
  const appsecretProof = createMetaAppSecretProof(env.META_PAGE_ACCESS_TOKEN);
  const endpoint = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${input.pageId}/feed`;
  const result = await postToFacebook({
    endpoint,
    payload: {
      access_token: env.META_PAGE_ACCESS_TOKEN,
      appsecret_proof: appsecretProof,
      link: input.link,
      message: input.caption,
    },
  });

  if (
    result.success &&
    result.rawResponse &&
    typeof result.rawResponse === "object" &&
    "id" in result.rawResponse &&
    typeof result.rawResponse.id === "string"
  ) {
    return {
      ...result,
      facebookPostId: result.rawResponse.id,
    };
  }

  return result.success
    ? {
        errorMessage: "Facebook returned an unexpected publish response.",
        rawResponse: result.rawResponse,
        statusCode: result.statusCode,
        success: false,
      }
    : result;
}

export async function publishPagePhotoPost(input: {
  caption: string;
  imageUrl: string;
  pageId: string;
}): Promise<FacebookPublishResult> {
  const env = getFacebookPublishingEnv();
  const appsecretProof = createMetaAppSecretProof(env.META_PAGE_ACCESS_TOKEN);
  const endpoint = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${input.pageId}/photos`;
  const result = await postToFacebook({
    endpoint,
    payload: {
      access_token: env.META_PAGE_ACCESS_TOKEN,
      appsecret_proof: appsecretProof,
      caption: input.caption,
      url: input.imageUrl,
    },
  });

  if (
    result.success &&
    result.rawResponse &&
    typeof result.rawResponse === "object"
  ) {
    const facebookPhotoId =
      "id" in result.rawResponse && typeof result.rawResponse.id === "string"
        ? result.rawResponse.id
        : undefined;
    const facebookPostId =
      "post_id" in result.rawResponse &&
      typeof result.rawResponse.post_id === "string"
        ? result.rawResponse.post_id
        : undefined;

    if (facebookPhotoId || facebookPostId) {
      return {
        ...result,
        facebookPhotoId,
        facebookPostId,
      };
    }
  }

  return result.success
    ? {
        errorMessage: "Facebook returned an unexpected photo publish response.",
        rawResponse: result.rawResponse,
        statusCode: result.statusCode,
        success: false,
      }
    : result;
}
