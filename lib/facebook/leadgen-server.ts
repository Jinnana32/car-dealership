import "server-only";

import { z } from "zod";

import { createMetaAppSecretProof } from "@/lib/facebook/server";

const facebookLeadgenEnvSchema = z.object({
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

const facebookLeadFieldDataItemSchema = z.object({
  name: z.string().trim().min(1),
  values: z.array(z.string()).default([]),
});

const facebookLeadDetailsSchema = z
  .object({
    ad_id: z.string().trim().optional().transform((value) => value || null),
    ad_name: z.string().trim().optional().transform((value) => value || null),
    adset_id: z.string().trim().optional().transform((value) => value || null),
    adset_name: z.string().trim().optional().transform((value) => value || null),
    campaign_id: z.string().trim().optional().transform((value) => value || null),
    campaign_name: z.string().trim().optional().transform((value) => value || null),
    created_time: z.string().trim().optional().transform((value) => value || null),
    field_data: z.array(facebookLeadFieldDataItemSchema).default([]),
    form_id: z.string().trim().optional().transform((value) => value || null),
    id: z.string().trim().min(1),
  })
  .passthrough();

const facebookLeadFormSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().optional().transform((value) => value || null),
  })
  .passthrough();

export type FacebookLeadFieldDataItem = z.infer<
  typeof facebookLeadFieldDataItemSchema
>;
export type FacebookLeadDetails = z.infer<typeof facebookLeadDetailsSchema>;

export type FacebookGraphFetchResult<T> = {
  data?: T;
  endpoint: string;
  errorMessage?: string;
  rawResponse?: unknown;
  statusCode: number;
  success: boolean;
};

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function getFacebookLeadgenEnv(): z.infer<typeof facebookLeadgenEnvSchema> {
  return facebookLeadgenEnvSchema.parse({
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN,
  });
}

function buildGraphApiErrorMessage(rawResponse: unknown, fallback: string): string {
  if (
    rawResponse &&
    typeof rawResponse === "object" &&
    "error" in rawResponse &&
    rawResponse.error &&
    typeof rawResponse.error === "object" &&
    "message" in rawResponse.error &&
    typeof rawResponse.error.message === "string"
  ) {
    return rawResponse.error.message;
  }

  return fallback;
}

async function fetchGraphApi<T>(input: {
  fallbackError: string;
  fields: string[];
  id: string;
  schema: z.ZodTypeAny;
}): Promise<FacebookGraphFetchResult<T>> {
  const env = getFacebookLeadgenEnv();
  const appsecretProof = createMetaAppSecretProof(env.META_PAGE_ACCESS_TOKEN);
  const params = new URLSearchParams({
    access_token: env.META_PAGE_ACCESS_TOKEN,
    appsecret_proof: appsecretProof,
    fields: input.fields.join(","),
  });
  const endpoint = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${input.id}?${params.toString()}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
    method: "GET",
  });
  const responseText = await response.text();
  const rawResponse = safeJsonParse(responseText);

  if (!response.ok) {
    return {
      endpoint,
      errorMessage: buildGraphApiErrorMessage(rawResponse, input.fallbackError),
      rawResponse,
      statusCode: response.status,
      success: false,
    };
  }

  const parsed = input.schema.safeParse(rawResponse);

  if (!parsed.success) {
    return {
      endpoint,
      errorMessage: "Facebook returned an unexpected response shape.",
      rawResponse,
      statusCode: response.status,
      success: false,
    };
  }

  return {
    data: parsed.data as T,
    endpoint,
    rawResponse,
    statusCode: response.status,
    success: true,
  };
}

export async function fetchFacebookLeadDetails(
  leadgenId: string,
): Promise<FacebookGraphFetchResult<FacebookLeadDetails>> {
  return fetchGraphApi<FacebookLeadDetails>({
    fallbackError: "Unable to fetch Facebook lead details.",
    fields: [
      "id",
      "created_time",
      "field_data",
      "form_id",
      "ad_id",
      "ad_name",
      "adset_id",
      "adset_name",
      "campaign_id",
      "campaign_name",
    ],
    id: leadgenId,
    schema: facebookLeadDetailsSchema,
  });
}

export async function fetchFacebookLeadFormName(
  formId: string,
): Promise<FacebookGraphFetchResult<{ formName: string | null; id: string }>> {
  const result = await fetchGraphApi<{ id: string; name: string | null }>({
    fallbackError: "Unable to fetch Facebook Lead Form details.",
    fields: ["id", "name"],
    id: formId,
    schema: facebookLeadFormSchema,
  });

  if (!result.success || !result.data) {
    return {
      endpoint: result.endpoint,
      errorMessage: result.errorMessage,
      rawResponse: result.rawResponse,
      statusCode: result.statusCode,
      success: result.success,
    };
  }

  return {
    ...result,
    data: {
      formName: result.data.name,
      id: result.data.id,
    },
  };
}
