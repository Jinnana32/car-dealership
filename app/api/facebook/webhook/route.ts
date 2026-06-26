import { NextResponse } from "next/server";

import {
  logFacebookWebhookError,
  logFacebookWebhookInfo,
  summarizeFacebookWebhookBody,
} from "@/lib/facebook/webhook-logger";

export { GET } from "@/app/api/facebook/leadgen/webhook/route";

const WEBHOOK_ENDPOINT = "/api/facebook/webhook";

const WEBHOOK_ACK = new NextResponse("EVENT_RECEIVED", {
  status: 200,
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  const headers = new Headers(request.headers);

  let parsedBody: unknown = null;

  try {
    parsedBody = JSON.parse(body) as unknown;
  } catch {
    logFacebookWebhookError("Unified webhook received invalid JSON body.", {
      endpoint: WEBHOOK_ENDPOINT,
    });

    return WEBHOOK_ACK;
  }

  logFacebookWebhookInfo("Unified webhook received.", {
    endpoint: WEBHOOK_ENDPOINT,
    ...summarizeFacebookWebhookBody(parsedBody),
  });

  const createRequest = (): Request =>
    new Request(request.url, {
      body,
      headers,
      method: "POST",
    });

  const [{ POST: leadgenPost }, { POST: commentsPost }, { POST: messengerPost }] =
    await Promise.all([
      import("@/app/api/facebook/leadgen/webhook/route"),
      import("@/app/api/facebook/comments/webhook/route"),
      import("@/app/api/facebook/messenger/webhook/route"),
    ]);

  const [leadgenResponse, commentsResponse, messengerResponse] = await Promise.all([
    leadgenPost(createRequest()),
    commentsPost(createRequest()),
    messengerPost(createRequest()),
  ]);

  logFacebookWebhookInfo("Unified webhook dispatch complete.", {
    commentsStatus: commentsResponse.status,
    endpoint: WEBHOOK_ENDPOINT,
    leadgenStatus: leadgenResponse.status,
    messengerStatus: messengerResponse.status,
  });

  return WEBHOOK_ACK;
}
