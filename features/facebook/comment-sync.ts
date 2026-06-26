import "server-only";

import { loadCustomerMatchIndex } from "@/features/facebook/comment-customer-matching";
import {
  buildParsedFacebookCommentEventFromGraph,
  processFacebookComment,
  type ResolvedPublicationContext,
} from "@/features/facebook/comment-server";
import { createFacebookApiLog, resolveFacebookWebhookContext } from "@/features/facebook/leadgen-server";
import {
  fetchFacebookPostComments,
  hasFacebookCommentSyncAccess,
  sanitizeFacebookGraphCommentsForLog,
} from "@/lib/facebook/graph-comments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SYNC_ENDPOINT = "/api/cron/facebook-comment-sync";
const MAX_POSTS_PER_RUN = 20;
const COMMENT_SYNC_LOOKBACK_DAYS = 90;

type PublicationSyncRow = {
  comments_last_synced_at: string | null;
  dealership_id: string;
  facebook_connection_id: string | null;
  facebook_page_id: string | null;
  facebook_post_id: string;
  id: string;
  vehicle_id: string;
};

export type FacebookCommentSyncSummary = {
  commentsFetched: number;
  dealershipCount: number;
  duplicateCount: number;
  failedCount: number;
  inquiryCount: number;
  postCount: number;
  processedCount: number;
  skippedReason: string | null;
};

function getLookbackIsoDate(): string {
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - COMMENT_SYNC_LOOKBACK_DAYS);

  return lookbackDate.toISOString();
}

function buildPublicationContext(publication: PublicationSyncRow): ResolvedPublicationContext {
  return {
    publicationId: publication.id,
    vehicleId: publication.vehicle_id,
  };
}

async function loadPublicationsForSync(): Promise<PublicationSyncRow[]> {
  const adminSupabase = createSupabaseAdminClient();
  const lookbackIsoDate = getLookbackIsoDate();
  const { data, error } = await adminSupabase
    .from("facebook_post_publications")
    .select(
      "id, dealership_id, vehicle_id, facebook_post_id, facebook_page_id, facebook_connection_id, comments_last_synced_at, published_at",
    )
    .eq("status", "published")
    .not("facebook_post_id", "is", null)
    .or(`published_at.gte.${lookbackIsoDate},published_at.is.null`)
    .order("comments_last_synced_at", { ascending: true, nullsFirst: true })
    .order("published_at", { ascending: false })
    .limit(MAX_POSTS_PER_RUN);

  if (error) {
    throw new Error("facebook_comment_sync_publication_query_failed");
  }

  return ((data ?? []) as Array<PublicationSyncRow & { published_at: string | null }>).map(
    (publication) => ({
      comments_last_synced_at: publication.comments_last_synced_at,
      dealership_id: publication.dealership_id,
      facebook_connection_id: publication.facebook_connection_id,
      facebook_page_id: publication.facebook_page_id,
      facebook_post_id: publication.facebook_post_id,
      id: publication.id,
      vehicle_id: publication.vehicle_id,
    }),
  );
}

async function markPublicationSynced(publicationId: string): Promise<void> {
  const adminSupabase = createSupabaseAdminClient();

  await adminSupabase
    .from("facebook_post_publications")
    .update({
      comments_last_synced_at: new Date().toISOString(),
    })
    .eq("id", publicationId);
}

export async function syncFacebookPostComments(): Promise<FacebookCommentSyncSummary> {
  const summary: FacebookCommentSyncSummary = {
    commentsFetched: 0,
    dealershipCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    inquiryCount: 0,
    postCount: 0,
    processedCount: 0,
    skippedReason: null,
  };

  if (!hasFacebookCommentSyncAccess()) {
    summary.skippedReason = "facebook_comment_sync_not_configured";

    return summary;
  }

  const publications = await loadPublicationsForSync();
  summary.postCount = publications.length;

  if (publications.length === 0) {
    return summary;
  }

  const dealershipIds = [...new Set(publications.map((publication) => publication.dealership_id))];
  summary.dealershipCount = dealershipIds.length;

  const adminSupabase = createSupabaseAdminClient();
  const customerMatchIndexByDealership = new Map<
    string,
    Awaited<ReturnType<typeof loadCustomerMatchIndex>>
  >();

  for (const dealershipId of dealershipIds) {
    customerMatchIndexByDealership.set(
      dealershipId,
      await loadCustomerMatchIndex({
        adminSupabase,
        dealershipId,
      }),
    );
  }

  for (const publication of publications) {
    const pageId =
      publication.facebook_page_id?.trim() ||
      publication.facebook_post_id.split("_")[0] ||
      process.env.META_PAGE_ID?.trim() ||
      null;

    if (!pageId) {
      summary.failedCount += 1;
      continue;
    }

    const webhookContext = await resolveFacebookWebhookContext(pageId);

    if (!webhookContext) {
      summary.failedCount += 1;

      await createFacebookApiLog({
        action: "facebook_comment_sync_post_skipped",
        dealershipId: publication.dealership_id,
        endpoint: SYNC_ENDPOINT,
        errorMessage: "No Facebook connection matched the publication page.",
        requestPayload: {
          facebook_page_id: pageId,
          facebook_post_id: publication.facebook_post_id,
          publication_id: publication.id,
        },
        responsePayload: {
          status: "skipped",
        },
        status: "error",
        statusCode: 404,
      });

      continue;
    }

    let comments: Awaited<ReturnType<typeof fetchFacebookPostComments>> = [];

    try {
      comments = await fetchFacebookPostComments({
        pageId,
        postId: publication.facebook_post_id,
      });
    } catch (error) {
      summary.failedCount += 1;

      const errorMessage =
        error instanceof Error ? error.message : "facebook_comment_sync_fetch_failed";

      await createFacebookApiLog({
        action: "facebook_comment_sync_fetch_failed",
        dealershipId: publication.dealership_id,
        endpoint: SYNC_ENDPOINT,
        errorMessage,
        requestPayload: {
          facebook_page_id: pageId,
          facebook_post_id: publication.facebook_post_id,
          publication_id: publication.id,
        },
        responsePayload: {
          status: "error",
        },
        status: "error",
        statusCode: 500,
      });

      continue;
    }

    summary.commentsFetched += comments.length;

    for (const comment of comments) {
      const parsedEvent = buildParsedFacebookCommentEventFromGraph({
        authorFacebookId: comment.authorFacebookId,
        authorName: comment.authorName,
        commentId: comment.commentId,
        createdTime: comment.createdTime,
        message: comment.message,
        pageId,
        parentCommentId: comment.parentCommentId,
        postId: publication.facebook_post_id,
      });

      const result = await processFacebookComment({
        context: webhookContext,
        customerMatchIndex: customerMatchIndexByDealership.get(publication.dealership_id),
        parsedEvent,
        publication: buildPublicationContext(publication),
      });

      if (result.status === "processed") {
        summary.processedCount += 1;
        summary.inquiryCount += 1;
      } else if (result.status === "duplicate") {
        summary.duplicateCount += 1;
      } else {
        summary.failedCount += 1;
      }
    }

    await markPublicationSynced(publication.id);

    await createFacebookApiLog({
      action: "facebook_comment_sync_post_processed",
      dealershipId: publication.dealership_id,
      endpoint: SYNC_ENDPOINT,
      requestPayload: {
        facebook_page_id: pageId,
        facebook_post_id: publication.facebook_post_id,
        publication_id: publication.id,
        vehicle_id: publication.vehicle_id,
      },
      responsePayload: {
        comments: sanitizeFacebookGraphCommentsForLog(comments),
        comments_fetched: comments.length,
      },
      status: "success",
      statusCode: 200,
    });
  }

  return summary;
}
