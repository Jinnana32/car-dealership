"use server";

import { revalidatePath } from "next/cache";

import { processFacebookComment } from "@/features/facebook/comment-server";
import { resolveFacebookWebhookContext } from "@/features/facebook/leadgen-server";
import type { FacebookPostComment } from "@/features/facebook/types";
import { facebookCommentRetrySchema } from "@/features/facebook/validators";
import { requireAdminAccessContext } from "@/lib/auth/session";
import { redirectWithMessage } from "@/lib/redirect";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getStringValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function sanitizeRedirectPath(
  candidate: string | undefined,
  fallback: string,
): string {
  if (!candidate || !candidate.startsWith("/admin/facebook")) {
    return fallback;
  }

  return candidate;
}

function revalidateFacebookCommentRoutes(input: {
  customerId?: string | null;
  inquiryId?: string | null;
}): void {
  revalidatePath("/admin/facebook");
  revalidatePath("/admin/facebook/comments");
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/customers");

  if (input.customerId) {
    revalidatePath(`/admin/customers/${input.customerId}`);
  }

  if (input.inquiryId) {
    revalidatePath(`/admin/inquiries/${input.inquiryId}`);
  }
}

function buildParsedEventFromCommentRow(row: FacebookPostComment) {
  const rawPayload =
    row.raw_payload &&
    typeof row.raw_payload === "object" &&
    !Array.isArray(row.raw_payload) &&
    "webhook_event" in row.raw_payload &&
    row.raw_payload.webhook_event &&
    typeof row.raw_payload.webhook_event === "object" &&
    !Array.isArray(row.raw_payload.webhook_event)
      ? (row.raw_payload.webhook_event as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  return {
    authorFacebookId: row.author_facebook_id,
    authorName: row.author_name,
    commentId: row.facebook_comment_id,
    createdTime: row.received_at,
    eventKey: `comment:${row.page_id}:${row.facebook_comment_id}`,
    eventName: "feed_comment_add",
    message: row.message,
    pageId: row.page_id,
    parentCommentId: row.parent_comment_id,
    postId: row.facebook_post_id,
    rawPayload,
  };
}

export async function retryFacebookCommentProcessing(
  formData: FormData,
): Promise<void> {
  const fallbackPath = "/admin/facebook/comments";
  const access = await requireAdminAccessContext(fallbackPath);
  const redirectPath = sanitizeRedirectPath(
    getStringValue(formData, "redirect_to") || undefined,
    fallbackPath,
  );

  if (!access) {
    redirectWithMessage(redirectPath, "error", "Admin access is required.");
  }

  const parsed = facebookCommentRetrySchema.safeParse({
    comment_id: formData.get("comment_id"),
    redirect_to: formData.get("redirect_to"),
  });

  if (!parsed.success) {
    redirectWithMessage(redirectPath, "error", "Select a valid comment to retry.");
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: commentRow } = await adminSupabase
    .from("facebook_post_comments")
    .select("*")
    .eq("dealership_id", access.dealership.id)
    .eq("id", parsed.data.comment_id)
    .maybeSingle<FacebookPostComment>();

  if (!commentRow) {
    redirectWithMessage(redirectPath, "error", "Comment record not found.");
  }

  if (commentRow.status !== "failed") {
    redirectWithMessage(redirectPath, "error", "Only failed comments can be retried.");
  }

  const webhookContext = await resolveFacebookWebhookContext(commentRow.page_id);

  if (!webhookContext) {
    redirectWithMessage(
      redirectPath,
      "error",
      "Facebook page connection could not be resolved.",
    );
  }

  const result = await processFacebookComment({
    context: webhookContext,
    parsedEvent: buildParsedEventFromCommentRow(commentRow),
  });

  revalidateFacebookCommentRoutes({
    customerId: result.customerId,
    inquiryId: result.inquiryId,
  });

  if (result.status === "failed") {
    redirectWithMessage(
      redirectPath,
      "error",
      result.errorMessage ?? "Comment retry failed.",
    );
  }

  if (result.status === "duplicate") {
    redirectWithMessage(redirectPath, "success", "Comment was already processed.");
  }

  redirectWithMessage(redirectPath, "success", "Comment processed and inquiry created.");
}
