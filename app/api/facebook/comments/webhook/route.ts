import { NextResponse } from "next/server";

import {
  describeFacebookCommentParseSkip,
  parseFacebookCommentEvent,
  processFacebookComment,
  upsertFacebookCommentWebhookEvent,
} from "@/features/facebook/comment-server";
import {
  createFacebookApiLog,
  resolveFacebookWebhookContext,
  updateFacebookWebhookEventStatus,
} from "@/features/facebook/leadgen-server";
import {
  facebookPageFeedWebhookSchema,
  facebookWebhookVerificationSchema,
} from "@/features/facebook/validators";
import {
  getFacebookWebhookVerifyToken,
  hasFacebookWebhookVerifyToken,
} from "@/lib/facebook/server";
import {
  logFacebookWebhookDebug,
  logFacebookWebhookError,
  logFacebookWebhookInfo,
  logFacebookWebhookWarn,
  summarizeFacebookWebhookBody,
} from "@/lib/facebook/webhook-logger";

const WEBHOOK_ENDPOINT = "/api/facebook/comments/webhook";

function buildAckResponse(): NextResponse {
  return new NextResponse("EVENT_RECEIVED", {
    status: 200,
  });
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
    return new Response("Invalid verification request.", {
      status: 400,
    });
  }

  if (
    parsed.data.mode !== "subscribe" ||
    parsed.data.token !== getFacebookWebhookVerifyToken()
  ) {
    return new Response("Forbidden", {
      status: 403,
    });
  }

  return new Response(parsed.data.challenge, {
    status: 200,
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    logFacebookWebhookError("Comments webhook received invalid JSON body.", {
      endpoint: WEBHOOK_ENDPOINT,
    });

    return NextResponse.json(
      {
        error: "Invalid request payload.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed = facebookPageFeedWebhookSchema.safeParse(body);

  if (!parsed.success) {
    logFacebookWebhookWarn("Comments webhook payload failed schema validation.", {
      endpoint: WEBHOOK_ENDPOINT,
      issues: parsed.error.issues.map((issue) => issue.message),
      ...summarizeFacebookWebhookBody(body),
    });

    return NextResponse.json(
      {
        error: "Invalid Facebook feed webhook payload.",
      },
      {
        status: 400,
      },
    );
  }

  logFacebookWebhookInfo("Comments webhook payload accepted.", {
    endpoint: WEBHOOK_ENDPOINT,
    ...summarizeFacebookWebhookBody(parsed.data),
  });

  let feedChangeCount = 0;
  let parsedCommentCount = 0;
  let processedCount = 0;

  for (const entry of parsed.data.entry) {
    const entryId = typeof entry.id === "string" ? entry.id : null;
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      if (!change || typeof change !== "object" || Array.isArray(change)) {
        logFacebookWebhookDebug("Skipping invalid change object.", {
          endpoint: WEBHOOK_ENDPOINT,
          entryId,
        });
        continue;
      }

      const changeRecord = change as Record<string, unknown>;
      const field =
        typeof changeRecord.field === "string" ? changeRecord.field : "unknown";

      if (changeRecord.field !== "feed") {
        logFacebookWebhookDebug("Skipping non-feed change.", {
          endpoint: WEBHOOK_ENDPOINT,
          entryId,
          field,
        });
        continue;
      }

      feedChangeCount += 1;

      const skipReason = describeFacebookCommentParseSkip({
        entryId,
        payload: changeRecord.value,
      });

      if (skipReason) {
        logFacebookWebhookInfo("Feed change ignored for comment processing.", {
          endpoint: WEBHOOK_ENDPOINT,
          entryId,
          field,
          skipReason,
        });
        continue;
      }

      const parsedEvent = parseFacebookCommentEvent({
        entryId,
        payload: changeRecord.value,
      });

      if (!parsedEvent) {
        logFacebookWebhookWarn("Comment event parse returned null unexpectedly.", {
          endpoint: WEBHOOK_ENDPOINT,
          entryId,
        });
        continue;
      }

      parsedCommentCount += 1;

      logFacebookWebhookInfo("Parsed Facebook comment event.", {
        authorFacebookId: parsedEvent.authorFacebookId,
        authorName: parsedEvent.authorName,
        commentId: parsedEvent.commentId,
        endpoint: WEBHOOK_ENDPOINT,
        pageId: parsedEvent.pageId,
        postId: parsedEvent.postId,
      });

      const webhookContext = await resolveFacebookWebhookContext(parsedEvent.pageId);

      if (!webhookContext) {
        logFacebookWebhookWarn("No Facebook connection matched webhook page.", {
          configuredPageId: process.env.META_PAGE_ID?.trim() || null,
          endpoint: WEBHOOK_ENDPOINT,
          pageId: parsedEvent.pageId,
        });
        continue;
      }

      logFacebookWebhookInfo("Resolved Facebook webhook context.", {
        dealershipId: webhookContext.dealershipId,
        endpoint: WEBHOOK_ENDPOINT,
        facebookConnectionId: webhookContext.facebookConnectionId,
        pageId: webhookContext.pageId,
      });

      const webhookEventId = await upsertFacebookCommentWebhookEvent({
        context: webhookContext,
        parsedEvent,
      });

      if (!webhookEventId) {
        logFacebookWebhookError("Failed to upsert facebook_webhook_events row.", {
          commentId: parsedEvent.commentId,
          dealershipId: webhookContext.dealershipId,
          endpoint: WEBHOOK_ENDPOINT,
          eventKey: parsedEvent.eventKey,
        });
      }

      try {
        const result = await processFacebookComment({
          context: webhookContext,
          parsedEvent,
        });

        if (result.status === "processed") {
          processedCount += 1;
        }

        logFacebookWebhookInfo("Facebook comment processing finished.", {
          commentId: result.commentId,
          customerId: result.customerId,
          endpoint: WEBHOOK_ENDPOINT,
          errorMessage: result.errorMessage ?? null,
          inquiryId: result.inquiryId,
          status: result.status,
        });

        await createFacebookApiLog({
          action: "facebook_comment_webhook_received",
          dealershipId: webhookContext.dealershipId,
          endpoint: WEBHOOK_ENDPOINT,
          errorMessage:
            result.status === "failed" ? result.errorMessage ?? null : null,
          requestPayload: {
            change: changeRecord,
          },
          responsePayload: {
            comment_id: result.commentId,
            inquiry_id: result.inquiryId,
            status: result.status,
          },
          status: result.status === "failed" ? "error" : "success",
          statusCode: result.status === "failed" ? 500 : 200,
        });

        if (webhookEventId) {
          await updateFacebookWebhookEventStatus({
            errorMessage:
              result.status === "duplicate"
                ? "Duplicate comment ignored."
                : result.status === "failed"
                  ? result.errorMessage ?? "Facebook comment processing failed."
                  : null,
            status:
              result.status === "duplicate"
                ? "ignored"
                : result.status === "failed"
                  ? "error"
                  : "processed",
            webhookEventId,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unexpected Facebook comment processing failure.";

        logFacebookWebhookError("Facebook comment processing threw.", {
          commentId: parsedEvent.commentId,
          endpoint: WEBHOOK_ENDPOINT,
          errorMessage,
        });

        await createFacebookApiLog({
          action: "facebook_comment_webhook_received",
          dealershipId: webhookContext.dealershipId,
          endpoint: WEBHOOK_ENDPOINT,
          errorMessage,
          requestPayload: {
            change: changeRecord,
          },
          responsePayload: {
            error: errorMessage,
          },
          status: "error",
          statusCode: 500,
        });

        if (webhookEventId) {
          await updateFacebookWebhookEventStatus({
            errorMessage,
            status: "error",
            webhookEventId,
          });
        }
      }
    }
  }

  logFacebookWebhookInfo("Comments webhook handling complete.", {
    endpoint: WEBHOOK_ENDPOINT,
    feedChangeCount,
    parsedCommentCount,
    processedCount,
  });

  return buildAckResponse();
}
