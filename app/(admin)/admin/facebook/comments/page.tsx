import Link from "next/link";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/ui/status-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { retryFacebookCommentProcessing } from "@/features/facebook/comment-actions";
import { getFacebookComments } from "@/features/facebook/comment-queries";
import { FacebookCommentStatusBadge } from "@/features/facebook/components/facebook-comment-status-badge";
import { FACEBOOK_COMMENT_STATUS_FILTER_OPTIONS } from "@/features/facebook/constants";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookCommentsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacebookCommentsPage({
  searchParams,
}: FacebookCommentsPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const result = await getFacebookComments(access, resolvedSearchParams);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Facebook Comments"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/facebook">Back to Hub</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/published-posts">Published Posts</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/pipeline?view=list">Open inquiries</Link>
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Imported comments
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.totalCount}
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Received
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.receivedCount}
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Processed
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.processedCount}
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Failed
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.failedCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.latestReceivedAt
                ? `Latest ${formatCrmDateTime(result.latestReceivedAt)}`
                : "No comments yet."}
            </p>
          </div>
        </div>

        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 lg:grid-cols-[240px_auto_auto]">
          <Select defaultValue={result.filters.status} name="status">
            {FACEBOOK_COMMENT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Button type="submit" variant="outline">
            Apply
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/facebook/comments">Reset</Link>
          </Button>
        </form>

        {result.comments.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              No post comments imported yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Comments on published Facebook posts will appear here after the Page feed webhook receives them or the comment poll sync job imports them.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Received</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Inquiry</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.comments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {formatCrmDateTime(comment.received_at)}
                      </TableCell>
                      <TableCell className="align-top">
                        <p className="font-medium text-foreground">{comment.author_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {comment.author_facebook_id || "No Facebook ID"}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[280px] align-top text-sm text-foreground">
                        <p className="whitespace-pre-wrap">{comment.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Post {comment.facebook_post_id}
                        </p>
                      </TableCell>
                      <TableCell className="align-top">
                        {comment.customer ? (
                          <div className="space-y-1">
                            <Link
                              className="font-medium text-primary hover:underline"
                              href={`/admin/customers/${comment.customer.id}`}
                            >
                              {comment.customer.full_name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {comment.customer.phone || comment.customer.email || "No phone or email"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        {comment.inquiry ? (
                          <div className="space-y-2">
                            <InquiryStatusBadge status={comment.inquiry.status} />
                            <div>
                              <Link
                                className="text-sm font-medium text-primary hover:underline"
                                href={`/admin/inquiries/${comment.inquiry.id}`}
                              >
                                Open inquiry
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not created</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {comment.vehicle ? (
                          <Link
                            className="font-medium text-primary hover:underline"
                            href={`/admin/vehicles/${comment.vehicle.id}`}
                          >
                            {comment.vehicle.title}
                          </Link>
                        ) : (
                          "Not linked"
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <FacebookCommentStatusBadge status={comment.status} />
                      </TableCell>
                      <TableCell className="max-w-[220px] align-top text-sm text-red-700">
                        {comment.error_message || "None"}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end gap-2">
                          {comment.status === "failed" ? (
                            <form action={retryFacebookCommentProcessing}>
                              <input name="comment_id" type="hidden" value={comment.id} />
                              <input
                                name="redirect_to"
                                type="hidden"
                                value="/admin/facebook/comments"
                              />
                              <SubmitButton pendingLabel="Retrying..." size="sm" type="submit">
                                Retry
                              </SubmitButton>
                            </form>
                          ) : null}
                          {comment.inquiry ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/inquiries/${comment.inquiry.id}`}>
                                Inquiry
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="px-1 text-sm text-muted-foreground">
              Showing {result.comments.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
