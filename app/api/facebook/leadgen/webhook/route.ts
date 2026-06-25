import { NextResponse } from "next/server";

import {
  createFacebookApiLog,
  parseFacebookLeadgenEvent,
  processFacebookLead,
  resolveFacebookWebhookContext,
  updateFacebookWebhookEventStatus,
  upsertFacebookWebhookEvent,
} from "@/features/facebook/leadgen-server";
import {
  facebookLeadWebhookSchema,
  facebookWebhookVerificationSchema,
} from "@/features/facebook/validators";
import {
  getFacebookWebhookVerifyToken,
  hasFacebookWebhookVerifyToken,
} from "@/lib/facebook/server";

const WEBHOOK_ENDPOINT = "/api/facebook/leadgen/webhook";

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
    return NextResponse.json(
      {
        error: "Invalid request payload.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed = facebookLeadWebhookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid Facebook lead webhook payload.",
      },
      {
        status: 400,
      },
    );
  }

  for (const entry of parsed.data.entry) {
    const entryId = typeof entry.id === "string" ? entry.id : null;
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      if (!change || typeof change !== "object" || Array.isArray(change)) {
        continue;
      }

      const changeRecord = change as Record<string, unknown>;

      if (changeRecord.field !== "leadgen") {
        continue;
      }

      const parsedEvent = parseFacebookLeadgenEvent({
        entryId,
        payload: changeRecord.value,
      });

      if (!parsedEvent) {
        continue;
      }

      const webhookContext = await resolveFacebookWebhookContext(parsedEvent.pageId);

      if (!webhookContext) {
        continue;
      }

      const webhookEventId = await upsertFacebookWebhookEvent({
        context: webhookContext,
        parsedEvent,
      });

      try {
        const result = await processFacebookLead({
          context: webhookContext,
          parsedEvent,
        });

        await createFacebookApiLog({
          action: "facebook_leadgen_webhook_received",
          dealershipId: webhookContext.dealershipId,
          endpoint: WEBHOOK_ENDPOINT,
          errorMessage:
            result.status === "failed" ? result.errorMessage ?? null : null,
          requestPayload: {
            change: changeRecord,
          },
          responsePayload: {
            inquiry_id: result.inquiryId,
            lead_id: result.leadId,
            status: result.status,
          },
          status: result.status === "failed" ? "error" : "success",
          statusCode: result.status === "failed" ? 500 : 200,
        });

        if (webhookEventId) {
          await updateFacebookWebhookEventStatus({
            errorMessage:
              result.status === "duplicate"
                ? "Duplicate leadgen_id ignored."
                : result.status === "failed"
                  ? result.errorMessage ?? "Facebook lead processing failed."
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
            : "Unexpected Facebook lead processing failure.";

        await createFacebookApiLog({
          action: "facebook_leadgen_webhook_received",
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

  return buildAckResponse();
}
