import "server-only";

import { buildCustomerNameParts } from "@/features/inquiries/utils";
import type { PaymentPreference } from "@/features/inquiries/types";
import type { CustomerUpdate } from "@/features/customers/types";
import { DEFAULT_FACEBOOK_LEAD_FIELD_MAP } from "@/features/facebook/constants";
import type {
  FacebookApiLogInsert,
  FacebookLead,
  FacebookLeadFieldMap,
  FacebookLeadFormMapping,
  FacebookLeadInsert,
  FacebookLeadProcessingSummary,
  FacebookLeadUpdate,
  FacebookWebhookEventInsert,
} from "@/features/facebook/types";
import {
  fetchFacebookLeadDetails,
  fetchFacebookLeadFormName,
  type FacebookLeadFieldDataItem,
} from "@/lib/facebook/leadgen-server";
import {
  sanitizeFacebookRequestPayload,
  sanitizeFacebookResponsePayload,
} from "@/lib/facebook/server";
import type { Json, Database } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const FACEBOOK_LEAD_EVENT_NOTE = "Facebook Lead Form submitted.";
const FACEBOOK_LEAD_EVENT_NAME = "facebook_lead_form_submitted";
const FACEBOOK_LEAD_SOURCE_DETAIL_FALLBACK = "Facebook Lead Form";

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

type FacebookInquiryLookup = Pick<
  Database["public"]["Tables"]["inquiries"]["Row"],
  "customer_id" | "id" | "vehicle_id"
>;

type FacebookCustomerLookup = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  "email" | "first_name" | "full_name" | "id" | "last_name" | "phone"
>;

type ParsedFacebookLeadgenEvent = {
  adId: string | null;
  createdTime: string | null;
  eventKey: string;
  eventName: string;
  formId: string | null;
  leadgenId: string;
  pageId: string;
  rawPayload: Record<string, unknown>;
};

type ResolvedFacebookWebhookContext = {
  dealershipId: string;
  facebookConnectionId: string | null;
  pageId: string;
};

type ResolvedVehicleContext = {
  vehicleId: string | null;
};

type MappedFacebookLeadFields = {
  budgetRange: string | null;
  email: string | null;
  fullName: string;
  message: string | null;
  paymentPreference: PaymentPreference;
  phone: string | null;
  unmappedFields: Array<{
    name: string;
    values: string[];
  }>;
};

function getStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toJsonRecord(value: Json | null | undefined): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Json>;
}

function toJsonValue(value: unknown): Json {
  if (value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
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

function buildFacebookLeadFieldMap(
  rawFieldMap: Json | null,
): FacebookLeadFieldMap {
  const fieldMap: FacebookLeadFieldMap = {
    budget_range: [...DEFAULT_FACEBOOK_LEAD_FIELD_MAP.budget_range],
    email: [...DEFAULT_FACEBOOK_LEAD_FIELD_MAP.email],
    full_name: [...DEFAULT_FACEBOOK_LEAD_FIELD_MAP.full_name],
    message: [...DEFAULT_FACEBOOK_LEAD_FIELD_MAP.message],
    payment_preference: [...DEFAULT_FACEBOOK_LEAD_FIELD_MAP.payment_preference],
    phone: [...DEFAULT_FACEBOOK_LEAD_FIELD_MAP.phone],
  };

  if (!rawFieldMap || typeof rawFieldMap !== "object" || Array.isArray(rawFieldMap)) {
    return fieldMap;
  }

  for (const [key, aliases] of Object.entries(rawFieldMap)) {
    if (!(key in fieldMap) || !Array.isArray(aliases)) {
      continue;
    }

    const cleanedAliases = aliases
      .filter((alias): alias is string => typeof alias === "string")
      .map((alias) => alias.trim())
      .filter(Boolean);

    if (cleanedAliases.length > 0) {
      fieldMap[key as keyof FacebookLeadFieldMap] = cleanedAliases;
    }
  }

  return fieldMap;
}

function normalizeLeadFieldName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function getFirstFieldValue(values: string[]): string | null {
  for (const value of values) {
    const normalized = value.trim();

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizePaymentPreference(
  value: string | null,
): PaymentPreference {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized.includes("cash")) {
    return "cash";
  }

  if (
    normalized.includes("financ") ||
    normalized.includes("loan") ||
    normalized.includes("install")
  ) {
    return "financing";
  }

  if (
    normalized.includes("undecided") ||
    normalized.includes("not sure") ||
    normalized.includes("either") ||
    normalized.includes("both")
  ) {
    return "undecided";
  }

  return "undecided";
}

function buildOriginalMessage(input: {
  mappedMessage: string | null;
  unmappedFields: Array<{
    name: string;
    values: string[];
  }>;
  fullName: string;
}): string {
  if (input.mappedMessage) {
    return input.mappedMessage;
  }

  if (input.unmappedFields.length === 0) {
    return `Facebook Lead Form submission from ${input.fullName}.`;
  }

  const details = input.unmappedFields
    .map((field) => {
      const value = getFirstFieldValue(field.values);

      return value ? `${field.name}: ${value}` : null;
    })
    .filter((value): value is string => Boolean(value));

  if (details.length === 0) {
    return `Facebook Lead Form submission from ${input.fullName}.`;
  }

  return `Facebook Lead Form submission from ${input.fullName}.\n${details.join("\n")}`;
}

function mapFacebookLeadFields(input: {
  fieldData: FacebookLeadFieldDataItem[];
  fieldMap: FacebookLeadFieldMap;
}): MappedFacebookLeadFields {
  const aliasesByTarget = new Map<
    keyof FacebookLeadFieldMap,
    Set<string>
  >();

  (Object.keys(input.fieldMap) as Array<keyof FacebookLeadFieldMap>).forEach(
    (key) => {
      aliasesByTarget.set(
        key,
        new Set(input.fieldMap[key].map((alias) => normalizeLeadFieldName(alias))),
      );
    },
  );

  let fullName: string | null = null;
  let phone: string | null = null;
  let email: string | null = null;
  let budgetRange: string | null = null;
  let message: string | null = null;
  let paymentPreference: PaymentPreference = null;
  const unmappedFields: MappedFacebookLeadFields["unmappedFields"] = [];

  for (const field of input.fieldData) {
    const normalizedName = normalizeLeadFieldName(field.name);
    const firstValue = getFirstFieldValue(field.values);
    let matchedKey: keyof FacebookLeadFieldMap | null = null;

    for (const [key, aliases] of aliasesByTarget.entries()) {
      if (aliases.has(normalizedName)) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      unmappedFields.push({
        name: field.name,
        values: field.values,
      });
      continue;
    }

    if (matchedKey === "full_name" && !fullName && firstValue) {
      fullName = firstValue;
      continue;
    }

    if (matchedKey === "phone" && !phone && firstValue) {
      phone = firstValue;
      continue;
    }

    if (matchedKey === "email" && !email && firstValue) {
      email = firstValue.toLowerCase();
      continue;
    }

    if (matchedKey === "budget_range" && !budgetRange && firstValue) {
      budgetRange = firstValue;
      continue;
    }

    if (matchedKey === "message" && !message && firstValue) {
      message = firstValue;
      continue;
    }

    if (
      matchedKey === "payment_preference" &&
      paymentPreference === null &&
      firstValue
    ) {
      paymentPreference = normalizePaymentPreference(firstValue);
    }
  }

  return {
    budgetRange,
    email,
    fullName: fullName || "Facebook Lead",
    message,
    paymentPreference,
    phone,
    unmappedFields,
  };
}

async function findExistingCustomer(input: {
  adminSupabase: AdminSupabaseClient;
  dealershipId: string;
  email: string | null;
  phone: string | null;
}): Promise<FacebookCustomerLookup | null> {
  if (input.phone) {
    const { data: phoneMatches, error } = await input.adminSupabase
      .from("customers")
      .select("id, full_name, first_name, last_name, phone, email")
      .eq("dealership_id", input.dealershipId)
      .eq("phone", input.phone)
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) {
      throw new Error("customer_phone_lookup_failed");
    }

    if (phoneMatches?.[0]) {
      return phoneMatches[0] as FacebookCustomerLookup;
    }
  }

  if (!input.email) {
    return null;
  }

  const { data: emailMatches, error } = await input.adminSupabase
    .from("customers")
    .select("id, full_name, first_name, last_name, phone, email")
    .eq("dealership_id", input.dealershipId)
    .ilike("email", input.email)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error("customer_email_lookup_failed");
  }

  return (emailMatches?.[0] as FacebookCustomerLookup | undefined) ?? null;
}

async function updateExistingCustomerMissingFields(input: {
  adminSupabase: AdminSupabaseClient;
  customer: FacebookCustomerLookup;
  email: string | null;
  fullName: string;
  phone: string | null;
}): Promise<void> {
  const customerUpdates: CustomerUpdate = {};
  const { firstName, lastName } = buildCustomerNameParts(input.fullName);

  if (!input.customer.phone && input.phone) {
    customerUpdates.phone = input.phone;
  }

  if (!input.customer.email && input.email) {
    customerUpdates.email = input.email;
  }

  if (!input.customer.first_name && firstName) {
    customerUpdates.first_name = firstName;
  }

  if (!input.customer.last_name && lastName) {
    customerUpdates.last_name = lastName;
  }

  if (!input.customer.full_name.trim()) {
    customerUpdates.full_name = input.fullName;
  }

  if (Object.keys(customerUpdates).length === 0) {
    return;
  }

  const { error } = await input.adminSupabase
    .from("customers")
    .update(customerUpdates)
    .eq("id", input.customer.id);

  if (error) {
    throw new Error("customer_update_failed");
  }
}

async function createCustomerRecord(input: {
  adminSupabase: AdminSupabaseClient;
  dealershipId: string;
  email: string | null;
  fullName: string;
  phone: string | null;
}): Promise<string> {
  const { firstName, lastName } = buildCustomerNameParts(input.fullName);
  const { data, error } = await input.adminSupabase
    .from("customers")
    .insert({
      dealership_id: input.dealershipId,
      email: input.email,
      first_name: firstName,
      full_name: input.fullName,
      last_name: lastName,
      phone: input.phone,
      source_type: "facebook_lead_form",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error("customer_create_failed");
  }

  return data.id;
}

async function findExistingInquiryByLeadgenId(input: {
  adminSupabase: AdminSupabaseClient;
  dealershipId: string;
  leadgenId: string;
}): Promise<FacebookInquiryLookup | null> {
  const { data } = await input.adminSupabase
    .from("inquiries")
    .select("id, customer_id, vehicle_id")
    .eq("dealership_id", input.dealershipId)
    .eq("source_type", "facebook_lead_form")
    .eq("source_reference_id", input.leadgenId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<FacebookInquiryLookup>();

  return data ?? null;
}

async function annotateInquiryArtifacts(input: {
  adminSupabase: AdminSupabaseClient;
  customerId: string;
  dealershipId: string;
  formId: string | null;
  formName: string | null;
  inquiryId: string;
  leadgenId: string;
  pageId: string | null;
  vehicleId: string | null;
  adId: string | null;
}): Promise<void> {
  const eventMetadata = {
    form_id: input.formId,
    form_name: input.formName,
    leadgen_id: input.leadgenId,
    source: "facebook_lead_form",
  } satisfies Record<string, Json>;

  const { data: createdEvent } = await input.adminSupabase
    .from("inquiry_events")
    .select("id, metadata")
    .eq("dealership_id", input.dealershipId)
    .eq("inquiry_id", input.inquiryId)
    .eq("event_type", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; metadata: Json }>();

  if (createdEvent) {
    const { error } = await input.adminSupabase
      .from("inquiry_events")
      .update({
        metadata: {
          ...toJsonRecord(createdEvent.metadata),
          ...eventMetadata,
        },
        note: FACEBOOK_LEAD_EVENT_NOTE,
      })
      .eq("id", createdEvent.id);

    if (error) {
      throw new Error("inquiry_event_update_failed");
    }
  } else {
    const { error } = await input.adminSupabase.from("inquiry_events").insert({
      dealership_id: input.dealershipId,
      event_type: "created",
      inquiry_id: input.inquiryId,
      metadata: eventMetadata,
      note: FACEBOOK_LEAD_EVENT_NOTE,
    });

    if (error) {
      throw new Error("inquiry_event_insert_failed");
    }
  }

  const leadSourceMetadata = {
    ad_id: input.adId,
    form_id: input.formId,
    form_name: input.formName,
    page_id: input.pageId,
  } satisfies Record<string, Json>;

  const { data: leadSourceEvent } = await input.adminSupabase
    .from("lead_source_events")
    .select("id, metadata")
    .eq("dealership_id", input.dealershipId)
    .eq("inquiry_id", input.inquiryId)
    .eq("source_type", "facebook_lead_form")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; metadata: Json }>();

  const sourceDetail =
    input.formName?.trim() || input.formId?.trim() || FACEBOOK_LEAD_SOURCE_DETAIL_FALLBACK;

  if (leadSourceEvent) {
    const { error } = await input.adminSupabase
      .from("lead_source_events")
      .update({
        customer_id: input.customerId,
        event_name: FACEBOOK_LEAD_EVENT_NAME,
        external_reference_id: input.leadgenId,
        metadata: {
          ...toJsonRecord(leadSourceEvent.metadata),
          ...leadSourceMetadata,
        },
        source_detail: sourceDetail,
        vehicle_id: input.vehicleId,
      })
      .eq("id", leadSourceEvent.id);

    if (error) {
      throw new Error("lead_source_event_update_failed");
    }
  } else {
    const { error } = await input.adminSupabase
      .from("lead_source_events")
      .insert({
        customer_id: input.customerId,
        dealership_id: input.dealershipId,
        event_name: FACEBOOK_LEAD_EVENT_NAME,
        external_reference_id: input.leadgenId,
        inquiry_id: input.inquiryId,
        metadata: leadSourceMetadata,
        source_detail: sourceDetail,
        source_type: "facebook_lead_form",
        vehicle_id: input.vehicleId,
      });

    if (error) {
      throw new Error("lead_source_event_insert_failed");
    }
  }
}

async function resolveFacebookLeadVehicle(input: {
  adminSupabase: AdminSupabaseClient;
  dealershipId: string;
  formName: string | null;
  mapping: FacebookLeadFormMapping | null;
}): Promise<ResolvedVehicleContext> {
  if (input.mapping?.vehicle_id) {
    const { data: mappedVehicle } = await input.adminSupabase
      .from("vehicles")
      .select("id")
      .eq("dealership_id", input.dealershipId)
      .eq("id", input.mapping.vehicle_id)
      .maybeSingle<{ id: string }>();

    if (mappedVehicle) {
      return {
        vehicleId: mappedVehicle.id,
      };
    }
  }

  const normalizedFormName = input.formName?.trim().toLowerCase() ?? "";

  if (!normalizedFormName) {
    return {
      vehicleId: null,
    };
  }

  const { data: vehicles } = await input.adminSupabase
    .from("vehicles")
    .select("id, slug, stock_number, title")
    .eq("dealership_id", input.dealershipId)
    .neq("status", "archived");

  const safeMatches = (vehicles ?? []).filter((vehicle) => {
    if (vehicle.stock_number?.trim()) {
      return normalizedFormName.includes(vehicle.stock_number.trim().toLowerCase());
    }

    if (vehicle.slug?.trim()) {
      return normalizedFormName.includes(vehicle.slug.trim().toLowerCase());
    }

    const title = vehicle.title?.trim().toLowerCase();

    return Boolean(title && title.length >= 6 && normalizedFormName.includes(title));
  });

  if (safeMatches.length !== 1) {
    return {
      vehicleId: null,
    };
  }

  return {
    vehicleId: safeMatches[0].id,
  };
}

async function getFacebookLeadFormMapping(input: {
  adminSupabase: AdminSupabaseClient;
  dealershipId: string;
  formId: string | null;
}): Promise<FacebookLeadFormMapping | null> {
  if (!input.formId) {
    return null;
  }

  const { data } = await input.adminSupabase
    .from("facebook_lead_form_mappings")
    .select("*")
    .eq("dealership_id", input.dealershipId)
    .eq("form_id", input.formId)
    .eq("is_active", true)
    .maybeSingle<FacebookLeadFormMapping>();

  return data ?? null;
}

export async function createFacebookApiLog(input: {
  action: string;
  dealershipId: string;
  endpoint: string | null;
  errorMessage?: string | null;
  requestPayload: unknown;
  responsePayload: unknown;
  status: "error" | "success";
  statusCode: number;
}): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();
  const payload: FacebookApiLogInsert = {
    action: input.action,
    created_by: null,
    dealership_id: input.dealershipId,
    endpoint: input.endpoint,
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

export async function resolveFacebookWebhookContext(
  pageId: string,
): Promise<ResolvedFacebookWebhookContext | null> {
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

export function parseFacebookLeadgenEvent(input: {
  entryId: string | null;
  payload: unknown;
}): ParsedFacebookLeadgenEvent | null {
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    return null;
  }

  const payload = input.payload as Record<string, unknown>;
  const leadgenId = getStringValue(payload.leadgen_id);
  const pageId = getStringValue(payload.page_id) ?? input.entryId;

  if (!leadgenId || !pageId) {
    return null;
  }

  return {
    adId: getStringValue(payload.ad_id),
    createdTime: getStringValue(payload.created_time),
    eventKey: `lead_form:${pageId}:${leadgenId}`,
    eventName: "leadgen",
    formId: getStringValue(payload.form_id),
    leadgenId,
    pageId,
    rawPayload: payload,
  };
}

export async function upsertFacebookWebhookEvent(input: {
  context: ResolvedFacebookWebhookContext;
  metadata?: Record<string, Json>;
  parsedEvent: ParsedFacebookLeadgenEvent;
}): Promise<string | null> {
  const adminSupabase = createSupabaseAdminClient();
  const payload: FacebookWebhookEventInsert = {
    dealership_id: input.context.dealershipId,
    error_message: null,
    event_key: input.parsedEvent.eventKey,
    event_name: input.parsedEvent.eventName,
    event_source: "lead_form",
    facebook_connection_id: input.context.facebookConnectionId,
    metadata: {
      ad_id: input.parsedEvent.adId,
      created_time: input.parsedEvent.createdTime,
      form_id: input.parsedEvent.formId,
      leadgen_id: input.parsedEvent.leadgenId,
      ...input.metadata,
    } satisfies Json,
    object_type: "page",
    page_id: input.context.pageId,
    raw_payload: input.parsedEvent.rawPayload as Json,
    recipient_id: null,
    sender_psid: null,
    status: "received",
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

export async function updateFacebookWebhookEventStatus(input: {
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

async function upsertFacebookLeadRow(input: {
  adminSupabase: AdminSupabaseClient;
  context: ResolvedFacebookWebhookContext;
  parsedEvent: ParsedFacebookLeadgenEvent;
}): Promise<FacebookLead | null> {
  const payload: FacebookLeadInsert = {
    ad_id: input.parsedEvent.adId,
    dealership_id: input.context.dealershipId,
    facebook_connection_id: input.context.facebookConnectionId,
    form_id: input.parsedEvent.formId,
    leadgen_id: input.parsedEvent.leadgenId,
    page_id: input.context.pageId,
    raw_payload: {
      webhook_event: toJsonValue(input.parsedEvent.rawPayload),
    } as Json,
    received_at: toIsoDateTime(input.parsedEvent.createdTime) ?? new Date().toISOString(),
    status: "received",
  };

  const { data, error } = await input.adminSupabase
    .from("facebook_leads")
    .upsert(payload, {
      onConflict: "dealership_id,leadgen_id",
    })
    .select("*")
    .single<FacebookLead>();

  if (error || !data) {
    return null;
  }

  return data;
}

async function updateFacebookLeadRow(input: {
  adminSupabase: AdminSupabaseClient;
  leadId: string;
  values: FacebookLeadUpdate;
}): Promise<void> {
  const { error } = await input.adminSupabase
    .from("facebook_leads")
    .update(input.values)
    .eq("id", input.leadId);

  if (error) {
    throw new Error("facebook_lead_update_failed");
  }
}

export async function processFacebookLead(input: {
  context: ResolvedFacebookWebhookContext;
  parsedEvent: ParsedFacebookLeadgenEvent;
}): Promise<FacebookLeadProcessingSummary> {
  const adminSupabase = createSupabaseAdminClient();
  const leadRow = await upsertFacebookLeadRow({
    adminSupabase,
    context: input.context,
    parsedEvent: input.parsedEvent,
  });

  if (!leadRow) {
    return {
      customerId: null,
      errorMessage: "Unable to store the Facebook lead record.",
      inquiryId: null,
      leadId: null,
      status: "failed",
    };
  }

  const existingInquiry = await findExistingInquiryByLeadgenId({
    adminSupabase,
    dealershipId: input.context.dealershipId,
    leadgenId: input.parsedEvent.leadgenId,
  });

  if (leadRow.status === "processed" && leadRow.inquiry_id && existingInquiry) {
    return {
      customerId: leadRow.customer_id,
      inquiryId: leadRow.inquiry_id,
      leadId: leadRow.id,
      status: "duplicate",
    };
  }

  const leadDetailsResult = await fetchFacebookLeadDetails(input.parsedEvent.leadgenId);

  await createFacebookApiLog({
    action: "facebook_lead_details_fetch",
    dealershipId: input.context.dealershipId,
    endpoint: leadDetailsResult.endpoint,
    errorMessage: leadDetailsResult.errorMessage ?? null,
    requestPayload: {
      leadgen_id: input.parsedEvent.leadgenId,
    },
    responsePayload: leadDetailsResult.rawResponse ?? {},
    status: leadDetailsResult.success ? "success" : "error",
    statusCode: leadDetailsResult.statusCode,
  });

  if (!leadDetailsResult.success || !leadDetailsResult.data) {
    await updateFacebookLeadRow({
      adminSupabase,
      leadId: leadRow.id,
      values: {
        error_message:
          leadDetailsResult.errorMessage ?? "Unable to fetch Facebook lead details.",
        processed_at: new Date().toISOString(),
        status: "failed",
      },
    });

    return {
      customerId: null,
      errorMessage:
        leadDetailsResult.errorMessage ?? "Unable to fetch Facebook lead details.",
      inquiryId: leadRow.inquiry_id,
      leadId: leadRow.id,
      status: "failed",
    };
  }

  const mapping = await getFacebookLeadFormMapping({
    adminSupabase,
    dealershipId: input.context.dealershipId,
    formId: leadDetailsResult.data.form_id ?? input.parsedEvent.formId,
  });
  let formName = mapping?.form_name?.trim() || null;
  let formResponsePayload: unknown = null;

  if (!formName && (leadDetailsResult.data.form_id ?? input.parsedEvent.formId)) {
    const formDetailsResult = await fetchFacebookLeadFormName(
      leadDetailsResult.data.form_id ?? input.parsedEvent.formId ?? "",
    );

    formResponsePayload = formDetailsResult.rawResponse ?? {};

    await createFacebookApiLog({
      action: "facebook_lead_form_fetch",
      dealershipId: input.context.dealershipId,
      endpoint: formDetailsResult.endpoint,
      errorMessage: formDetailsResult.errorMessage ?? null,
      requestPayload: {
        form_id: leadDetailsResult.data.form_id ?? input.parsedEvent.formId,
      },
      responsePayload: formDetailsResult.rawResponse ?? {},
      status: formDetailsResult.success ? "success" : "error",
      statusCode: formDetailsResult.statusCode,
    });

    if (formDetailsResult.success && formDetailsResult.data?.formName) {
      formName = formDetailsResult.data.formName;
    }
  }

  const fieldMap = buildFacebookLeadFieldMap(mapping?.field_map ?? null);
  const mappedFields = mapFacebookLeadFields({
    fieldData: leadDetailsResult.data.field_data,
    fieldMap,
  });
  const resolvedVehicle = await resolveFacebookLeadVehicle({
    adminSupabase,
    dealershipId: input.context.dealershipId,
    formName,
    mapping,
  });
  const sourceDetail =
    formName ||
    leadDetailsResult.data.form_id ||
    input.parsedEvent.formId ||
    FACEBOOK_LEAD_SOURCE_DETAIL_FALLBACK;
  const originalMessage = buildOriginalMessage({
    fullName: mappedFields.fullName,
    mappedMessage: mappedFields.message,
    unmappedFields: mappedFields.unmappedFields,
  });
  let customerId = leadRow.customer_id;
  let inquiryId = leadRow.inquiry_id;
  let inquiryVehicleId = leadRow.vehicle_id ?? resolvedVehicle.vehicleId;

  try {
    if (existingInquiry) {
      inquiryId = existingInquiry.id;
      customerId = existingInquiry.customer_id;
      inquiryVehicleId = existingInquiry.vehicle_id ?? inquiryVehicleId;
    } else {
      const existingCustomer = await findExistingCustomer({
        adminSupabase,
        dealershipId: input.context.dealershipId,
        email: mappedFields.email,
        phone: mappedFields.phone,
      });

      if (existingCustomer) {
        await updateExistingCustomerMissingFields({
          adminSupabase,
          customer: existingCustomer,
          email: mappedFields.email,
          fullName: mappedFields.fullName,
          phone: mappedFields.phone,
        });
        customerId = existingCustomer.id;
      } else {
        customerId = await createCustomerRecord({
          adminSupabase,
          dealershipId: input.context.dealershipId,
          email: mappedFields.email,
          fullName: mappedFields.fullName,
          phone: mappedFields.phone,
        });
      }

      if (!customerId) {
        throw new Error("customer_missing");
      }

      const { data: inquiry, error: inquiryError } = await adminSupabase
        .from("inquiries")
        .insert({
          budget_range: mappedFields.budgetRange,
          customer_id: customerId,
          dealership_id: input.context.dealershipId,
          next_follow_up_at: toIsoDateTime(input.parsedEvent.createdTime),
          original_message: originalMessage,
          payment_preference: mappedFields.paymentPreference,
          source_detail: sourceDetail,
          source_reference_id: input.parsedEvent.leadgenId,
          source_type: "facebook_lead_form",
          status: "new",
          vehicle_id: inquiryVehicleId,
        })
        .select("id")
        .single<{ id: string }>();

      if (inquiryError || !inquiry) {
        throw new Error("inquiry_create_failed");
      }

      inquiryId = inquiry.id;
    }

    if (!customerId || !inquiryId) {
      throw new Error("lead_processing_incomplete");
    }

    await annotateInquiryArtifacts({
      adminSupabase,
      adId: leadDetailsResult.data.ad_id ?? input.parsedEvent.adId,
      customerId,
      dealershipId: input.context.dealershipId,
      formId: leadDetailsResult.data.form_id ?? input.parsedEvent.formId,
      formName,
      inquiryId,
      leadgenId: input.parsedEvent.leadgenId,
      pageId: input.context.pageId,
      vehicleId: inquiryVehicleId,
    });

    await updateFacebookLeadRow({
      adminSupabase,
      leadId: leadRow.id,
      values: {
        ad_id: leadDetailsResult.data.ad_id ?? input.parsedEvent.adId,
        ad_name: leadDetailsResult.data.ad_name,
        adset_id: leadDetailsResult.data.adset_id,
        adset_name: leadDetailsResult.data.adset_name,
        campaign_id: leadDetailsResult.data.campaign_id,
        campaign_name: leadDetailsResult.data.campaign_name,
        customer_id: customerId,
        error_message: null,
        field_data: leadDetailsResult.data.field_data as unknown as Json,
        form_id: leadDetailsResult.data.form_id ?? input.parsedEvent.formId,
        form_name: formName,
        inquiry_id: inquiryId,
        page_id: input.context.pageId,
        processed_at: new Date().toISOString(),
        raw_payload: {
          graph_form_detail: toJsonValue(formResponsePayload),
          graph_lead_detail: toJsonValue(leadDetailsResult.rawResponse ?? {}),
          webhook_event: toJsonValue(input.parsedEvent.rawPayload),
        } as Json,
        status: "processed",
        vehicle_id: inquiryVehicleId,
      },
    });

    return {
      customerId,
      inquiryId,
      leadId: leadRow.id,
      status: "processed",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message.replaceAll("_", " ")
        : "Unable to process Facebook Lead Form submission.";

    await updateFacebookLeadRow({
      adminSupabase,
      leadId: leadRow.id,
      values: {
        ad_id: leadDetailsResult.data.ad_id ?? input.parsedEvent.adId,
        ad_name: leadDetailsResult.data.ad_name,
        adset_id: leadDetailsResult.data.adset_id,
        adset_name: leadDetailsResult.data.adset_name,
        campaign_id: leadDetailsResult.data.campaign_id,
        campaign_name: leadDetailsResult.data.campaign_name,
        customer_id: customerId,
        error_message: errorMessage,
        field_data: leadDetailsResult.data.field_data as unknown as Json,
        form_id: leadDetailsResult.data.form_id ?? input.parsedEvent.formId,
        form_name: formName,
        inquiry_id: inquiryId,
        page_id: input.context.pageId,
        processed_at: new Date().toISOString(),
        raw_payload: {
          graph_form_detail: toJsonValue(formResponsePayload),
          graph_lead_detail: toJsonValue(leadDetailsResult.rawResponse ?? {}),
          webhook_event: toJsonValue(input.parsedEvent.rawPayload),
        } as Json,
        status: "failed",
        vehicle_id: inquiryVehicleId,
      },
    });

    return {
      customerId,
      errorMessage,
      inquiryId,
      leadId: leadRow.id,
      status: "failed",
    };
  }
}
