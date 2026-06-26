import { NextResponse } from "next/server";

import { syncFacebookPostComments } from "@/features/facebook/comment-sync";

function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  if (authorization === `Bearer ${secret}`) {
    return true;
  }

  return request.headers.get("x-cron-secret") === secret;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized cron request.",
      },
      {
        status: 401,
      },
    );
  }

  const summary = await syncFacebookPostComments();

  return NextResponse.json({
    ok: true,
    summary,
  });
}

export async function POST(request: Request): Promise<Response> {
  return GET(request);
}
