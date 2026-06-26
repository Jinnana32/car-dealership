import "server-only";

import { buildCustomerNameParts } from "@/features/inquiries/utils";
import { resolveCustomerForFacebookAuthor } from "@/features/facebook/comment-customer-matching";
import type { CustomerMatchIndex } from "@/features/facebook/comment-customer-matching";
import { resolveFacebookWebhookContext } from "@/features/facebook/leadgen-server";
import type {
  FacebookPostComment,
  FacebookPostCommentInsert,
  FacebookPostCommentProcessingSummary,
  FacebookPostCommentUpdate,
  FacebookWebhookEventInsert,
} from "@/features/facebook/types";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logFacebookWebhookInfo } from "@/lib/facebook/webhook-logger";

const FACEBOOK_COMMENT_EVENT_NOTE = "Facebook post comment received.";
const FACEBOOK_COMMENT_EVENT_NAME = "facebook_comment_received";
const FACEBOOK_COMMENT_SOURCE_DETAIL = "Facebook Post Comment";

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

export type ParsedFacebookCommentEvent = {
  authorFacebookId: string | null;
  authorName: string;
  commentId: string;
  createdTime: string | null;
  eventKey: string;
  eventName: string;
  message: string;
  pageId: string;
  parentCommentId: string | null;
  postId: string;
  rawPayload: Record<string, unknown>;
};

type ResolvedFacebookWebhookContext = NonNullable<
  Awaited<ReturnType<typeof resolveFacebookWebhookContext>>
>;

export type ResolvedPublicationContext = {
  publicationId: string | null;
  vehicleId: string | null;
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

function toIsoDateTime(value: string | number | null): string | null {
  if (value === null) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? new Date(value > 10_000_000_000 ? value : value * 1000)
      : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toJsonValue(value: unknown): Json {
  if (value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}

export function describeFacebookCommentParseSkip(input: {
  entryId: string | null;
  payload: unknown;
}): string | null {
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    return "change_value_not_object";
  }

  const payload = input.payload as Record<string, unknown>;
  const item = getStringValue(payload.item);
  const verb = getStringValue(payload.verb);

  if (item !== "comment" || verb !== "add") {
    return `not_comment_add (item=${item ?? "null"}, verb=${verb ?? "null"})`;
  }

  const commentId = getStringValue(payload.comment_id);
  const postId = getStringValue(payload.post_id);
  const pageId = input.entryId ?? getStringValue(payload.post_id)?.split("_")[0] ?? null;
  const message = getStringValue(payload.message)?.trim() ?? "";

  if (!commentId) {
    return "missing_comment_id";
  }

  if (!postId) {
    return "missing_post_id";
  }

  if (!pageId) {
    return "missing_page_id";
  }

  if (!message) {
    return "missing_message";
  }

  const from =
    payload.from && typeof payload.from === "object" && !Array.isArray(payload.from)
      ? (payload.from as Record<string, unknown>)
      : null;
  const authorFacebookId = from ? getStringValue(from.id) : null;
  const authorName = from ? getStringValue(from.name) : null;

  if (!authorName) {
    return "missing_author_name";
  }

  if (authorFacebookId && authorFacebookId === pageId) {
    return "comment_from_page_owner";
  }

  return null;
}

export function buildParsedFacebookCommentEventFromGraph(input: {
  authorFacebookId: string | null;
  authorName: string;
  commentId: string;
  createdTime: string | null;
  message: string;
  pageId: string;
  parentCommentId: string | null;
  postId: string;
}): ParsedFacebookCommentEvent {
  return {
    authorFacebookId: input.authorFacebookId,
    authorName: input.authorName,
    commentId: input.commentId,
    createdTime: input.createdTime,
    eventKey: `comment:${input.pageId}:${input.commentId}`,
    eventName: "feed_comment_add",
    message: input.message,
    pageId: input.pageId,
    parentCommentId: input.parentCommentId,
    postId: input.postId,
    rawPayload: {
      comment_id: input.commentId,
      from: {
        id: input.authorFacebookId,
        name: input.authorName,
      },
      item: "comment",
      message: input.message,
      post_id: input.postId,
      sync_source: "facebook_comment_poll",
      verb: "add",
    },
  };
}

export function parseFacebookCommentEvent(input: {
  entryId: string | null;
  payload: unknown;
}): ParsedFacebookCommentEvent | null {
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    return null;
  }

  const payload = input.payload as Record<string, unknown>;
  const item = getStringValue(payload.item);
  const verb = getStringValue(payload.verb);

  if (item !== "comment" || verb !== "add") {
    return null;
  }

  const commentId = getStringValue(payload.comment_id);
  const postId = getStringValue(payload.post_id);
  const pageId = input.entryId ?? getStringValue(payload.post_id)?.split("_")[0] ?? null;
  const message = getStringValue(payload.message)?.trim() ?? "";

  if (!commentId || !postId || !pageId || !message) {
    return null;
  }

  const from =
    payload.from && typeof payload.from === "object" && !Array.isArray(payload.from)
      ? (payload.from as Record<string, unknown>)
      : null;
  const authorFacebookId = from ? getStringValue(from.id) : null;
  const authorName = from ? getStringValue(from.name) : null;

  if (!authorName) {
    return null;
  }

  if (authorFacebookId && authorFacebookId === pageId) {
    return null;
  }

  const createdTime =
    toIsoDateTime(getNumberValue(payload.created_time)) ??
    toIsoDateTime(getStringValue(payload.created_time));

  return {
    authorFacebookId,
    authorName,
    commentId,
    createdTime,
    eventKey: `comment:${pageId}:${commentId}`,
    eventName: "feed_comment_add",
    message,
    pageId,
    parentCommentId: getStringValue(payload.parent_id),
    postId,
    rawPayload: payload,
  };
}

export async function upsertFacebookCommentWebhookEvent(input: {
  context: ResolvedFacebookWebhookContext;
  parsedEvent: ParsedFacebookCommentEvent;
}): Promise<string | null> {
  const adminSupabase = createSupabaseAdminClient();
  const payload: FacebookWebhookEventInsert = {
    dealership_id: input.context.dealershipId,
    error_message: null,
    event_key: input.parsedEvent.eventKey,
    event_name: input.parsedEvent.eventName,
    event_source: "comment",
    facebook_connection_id: input.context.facebookConnectionId,
    metadata: {
      author_facebook_id: input.parsedEvent.authorFacebookId,
      comment_id: input.parsedEvent.commentId,
      post_id: input.parsedEvent.postId,
    } satisfies Json,
    object_type: "page",
    page_id: input.context.pageId,
    raw_payload: input.parsedEvent.rawPayload as Json,
    recipient_id: null,
    sender_psid: input.parsedEvent.authorFacebookId,
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

async function resolvePublicationByPostId(input: {
  adminSupabase: AdminSupabaseClient;
  dealershipId: string;
  postId: string;
}): Promise<ResolvedPublicationContext> {
  const { data: exactMatch } = await input.adminSupabase
    .from("facebook_post_publications")
    .select("id, vehicle_id, facebook_post_id")
    .eq("dealership_id", input.dealershipId)
    .eq("status", "published")
    .eq("facebook_post_id", input.postId)
    .maybeSingle<{ facebook_post_id: string | null; id: string; vehicle_id: string }>();

  if (exactMatch) {
    return {
      publicationId: exactMatch.id,
      vehicleId: exactMatch.vehicle_id,
    };
  }

  const postSuffix = input.postId.includes("_")
    ? input.postId.split("_").slice(1).join("_")
    : input.postId;

  const { data: publications } = await input.adminSupabase
    .from("facebook_post_publications")
    .select("id, vehicle_id, facebook_post_id")
    .eq("dealership_id", input.dealershipId)
    .eq("status", "published")
    .not("facebook_post_id", "is", null);

  const fuzzyMatch = (publications ?? []).find((publication) => {
    const storedPostId = publication.facebook_post_id?.trim();

    if (!storedPostId) {
      return false;
    }

    return (
      storedPostId === input.postId ||
      storedPostId.endsWith(`_${postSuffix}`) ||
      input.postId.endsWith(`_${storedPostId.split("_").slice(1).join("_")}`)
    );
  });

  return {
    publicationId: fuzzyMatch?.id ?? null,
    vehicleId: fuzzyMatch?.vehicle_id ?? null,
  };
}

async function upsertFacebookPostCommentRow(input: {
  adminSupabase: AdminSupabaseClient;
  context: ResolvedFacebookWebhookContext;
  parsedEvent: ParsedFacebookCommentEvent;
  publication: ResolvedPublicationContext;
}): Promise<FacebookPostComment | null> {
  const payload: FacebookPostCommentInsert = {
    author_facebook_id: input.parsedEvent.authorFacebookId,
    author_name: input.parsedEvent.authorName,
    dealership_id: input.context.dealershipId,
    facebook_comment_id: input.parsedEvent.commentId,
    facebook_connection_id: input.context.facebookConnectionId,
    facebook_post_id: input.parsedEvent.postId,
    message: input.parsedEvent.message,
    page_id: input.context.pageId,
    parent_comment_id: input.parsedEvent.parentCommentId,
    publication_id: input.publication.publicationId,
    raw_payload: {
      webhook_event: toJsonValue(input.parsedEvent.rawPayload),
    } as Json,
    received_at: input.parsedEvent.createdTime ?? new Date().toISOString(),
    status: "received",
    vehicle_id: input.publication.vehicleId,
  };

  const { data, error } = await input.adminSupabase
    .from("facebook_post_comments")
    .upsert(payload, {
      onConflict: "dealership_id,facebook_comment_id",
    })
    .select("*")
    .single<FacebookPostComment>();

  if (error || !data) {
    return null;
  }

  return data;
}

async function updateFacebookPostCommentRow(input: {
  adminSupabase: AdminSupabaseClient;
  commentId: string;
  values: FacebookPostCommentUpdate;
}): Promise<void> {
  const { error } = await input.adminSupabase
    .from("facebook_post_comments")
    .update(input.values)
    .eq("id", input.commentId);

  if (error) {
    throw new Error("facebook_post_comment_update_failed");
  }
}

async function createCustomerFromCommentAuthor(input: {
  adminSupabase: AdminSupabaseClient;
  authorFacebookId: string | null;
  authorName: string;
  dealershipId: string;
}): Promise<string> {
  const { firstName, lastName } = buildCustomerNameParts(input.authorName);
  const facebookProfileUrl = input.authorFacebookId
    ? `https://www.facebook.com/profile.php?id=${input.authorFacebookId}`
    : null;

  const { data, error } = await input.adminSupabase
    .from("customers")
    .insert({
      dealership_id: input.dealershipId,
      fb_customer_id: input.authorFacebookId,
      facebook_profile_url: facebookProfileUrl,
      first_name: firstName,
      full_name: input.authorName,
      last_name: lastName,
      source_type: "facebook_comment",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error("customer_create_failed");
  }

  return data.id;
}

async function findExistingInquiryByCommentId(input: {
  adminSupabase: AdminSupabaseClient;
  commentId: string;
  dealershipId: string;
}): Promise<string | null> {
  const { data } = await input.adminSupabase
    .from("inquiries")
    .select("id")
    .eq("dealership_id", input.dealershipId)
    .eq("source_type", "facebook_comment")
    .eq("source_reference_id", input.commentId)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}

async function annotateCommentInquiryArtifacts(input: {
  adminSupabase: AdminSupabaseClient;
  authorFacebookId: string | null;
  authorName: string;
  commentId: string;
  customerId: string;
  dealershipId: string;
  inquiryId: string;
  message: string;
  pageId: string;
  postId: string;
  vehicleId: string | null;
}): Promise<void> {
  const eventMetadata = {
    author_facebook_id: input.authorFacebookId,
    author_name: input.authorName,
    comment_id: input.commentId,
    post_id: input.postId,
    source: "facebook_comment",
  } satisfies Record<string, Json>;

  await input.adminSupabase.from("inquiry_events").insert({
    dealership_id: input.dealershipId,
    event_type: "created",
    inquiry_id: input.inquiryId,
    metadata: eventMetadata,
    note: FACEBOOK_COMMENT_EVENT_NOTE,
  });

  await input.adminSupabase.from("lead_source_events").insert({
    customer_id: input.customerId,
    dealership_id: input.dealershipId,
    event_name: FACEBOOK_COMMENT_EVENT_NAME,
    external_reference_id: input.commentId,
    inquiry_id: input.inquiryId,
    metadata: {
      author_facebook_id: input.authorFacebookId,
      author_name: input.authorName,
      page_id: input.pageId,
      post_id: input.postId,
    } satisfies Json,
    source_detail: FACEBOOK_COMMENT_SOURCE_DETAIL,
    source_type: "facebook_comment",
    vehicle_id: input.vehicleId,
  });
}

export async function processFacebookComment(input: {
  context: ResolvedFacebookWebhookContext;
  customerMatchIndex?: CustomerMatchIndex;
  parsedEvent: ParsedFacebookCommentEvent;
  publication?: ResolvedPublicationContext;
}): Promise<FacebookPostCommentProcessingSummary> {
  const adminSupabase = createSupabaseAdminClient();
  const publication =
    input.publication ??
    (await resolvePublicationByPostId({
      adminSupabase,
      dealershipId: input.context.dealershipId,
      postId: input.parsedEvent.postId,
    }));

  logFacebookWebhookInfo("Resolved publication for Facebook comment.", {
    commentId: input.parsedEvent.commentId,
    postId: input.parsedEvent.postId,
    publicationId: publication.publicationId,
    vehicleId: publication.vehicleId,
  });

  const commentRow = await upsertFacebookPostCommentRow({
    adminSupabase,
    context: input.context,
    parsedEvent: input.parsedEvent,
    publication,
  });

  if (!commentRow) {
    return {
      commentId: null,
      customerId: null,
      errorMessage: "Unable to store the Facebook comment record.",
      inquiryId: null,
      status: "failed",
    };
  }

  if (commentRow.status === "processed" && commentRow.inquiry_id) {
    return {
      commentId: commentRow.id,
      customerId: commentRow.customer_id,
      inquiryId: commentRow.inquiry_id,
      status: "duplicate",
    };
  }

  const existingInquiryId = await findExistingInquiryByCommentId({
    adminSupabase,
    commentId: input.parsedEvent.commentId,
    dealershipId: input.context.dealershipId,
  });

  if (existingInquiryId) {
    await updateFacebookPostCommentRow({
      adminSupabase,
      commentId: commentRow.id,
      values: {
        customer_id: commentRow.customer_id,
        error_message: null,
        inquiry_id: existingInquiryId,
        processed_at: new Date().toISOString(),
        status: "duplicate",
        vehicle_id: commentRow.vehicle_id ?? publication.vehicleId,
      },
    });

    return {
      commentId: commentRow.id,
      customerId: commentRow.customer_id,
      inquiryId: existingInquiryId,
      status: "duplicate",
    };
  }

  let customerId = commentRow.customer_id;
  let inquiryId: string | null = null;

  try {
    if (!customerId) {
      customerId = await resolveCustomerForFacebookAuthor({
        adminSupabase,
        authorFacebookId: input.parsedEvent.authorFacebookId,
        authorName: input.parsedEvent.authorName,
        dealershipId: input.context.dealershipId,
        matchIndex: input.customerMatchIndex,
      });
    }

    if (!customerId) {
      customerId = await createCustomerFromCommentAuthor({
        adminSupabase,
        authorFacebookId: input.parsedEvent.authorFacebookId,
        authorName: input.parsedEvent.authorName,
        dealershipId: input.context.dealershipId,
      });
    }

    const { data: inquiry, error: inquiryError } = await adminSupabase
      .from("inquiries")
      .insert({
        customer_id: customerId,
        dealership_id: input.context.dealershipId,
        next_follow_up_at: input.parsedEvent.createdTime,
        original_message: input.parsedEvent.message,
        source_detail: FACEBOOK_COMMENT_SOURCE_DETAIL,
        source_reference_id: input.parsedEvent.commentId,
        source_type: "facebook_comment",
        status: "new",
        vehicle_id: publication.vehicleId,
      })
      .select("id")
      .single<{ id: string }>();

    if (inquiryError || !inquiry) {
      throw new Error("inquiry_create_failed");
    }

    inquiryId = inquiry.id;

    await annotateCommentInquiryArtifacts({
      adminSupabase,
      authorFacebookId: input.parsedEvent.authorFacebookId,
      authorName: input.parsedEvent.authorName,
      commentId: input.parsedEvent.commentId,
      customerId,
      dealershipId: input.context.dealershipId,
      inquiryId,
      message: input.parsedEvent.message,
      pageId: input.context.pageId,
      postId: input.parsedEvent.postId,
      vehicleId: publication.vehicleId,
    });

    await updateFacebookPostCommentRow({
      adminSupabase,
      commentId: commentRow.id,
      values: {
        customer_id: customerId,
        error_message: null,
        inquiry_id: inquiryId,
        processed_at: new Date().toISOString(),
        publication_id: publication.publicationId,
        status: "processed",
        vehicle_id: publication.vehicleId,
      },
    });

    return {
      commentId: commentRow.id,
      customerId,
      inquiryId,
      status: "processed",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message.replaceAll("_", " ")
        : "Unable to process Facebook comment.";

    await updateFacebookPostCommentRow({
      adminSupabase,
      commentId: commentRow.id,
      values: {
        customer_id: customerId,
        error_message: errorMessage,
        inquiry_id: inquiryId,
        processed_at: new Date().toISOString(),
        status: "failed",
        vehicle_id: publication.vehicleId,
      },
    });

    return {
      commentId: commentRow.id,
      customerId,
      errorMessage,
      inquiryId,
      status: "failed",
    };
  }
}
