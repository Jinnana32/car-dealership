import Link from "next/link";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { MessengerConversationStatusBadge } from "@/features/facebook/components/messenger-conversation-status-badge";
import {
  ignoreMessengerConversation,
  markMessengerConversationReviewed,
} from "@/features/facebook/messenger-actions";
import { getMessengerConversations } from "@/features/facebook/messenger-queries";
import { FACEBOOK_MESSENGER_CONVERSATION_STATUS_FILTER_OPTIONS } from "@/features/facebook/constants";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookMessengerPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    q?: string | string[];
    status?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacebookMessengerPage({
  searchParams,
}: FacebookMessengerPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const result = await getMessengerConversations(access, resolvedSearchParams);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Messenger Conversations"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/facebook">Back to Hub</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/settings">Facebook Settings</Link>
            </Button>
          </>
        }
        tabs={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/facebook">Overview</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/facebook/content">Content History</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/facebook/published-posts">Published Posts</Link>
            </Button>
            <Button size="sm" type="button">
              Messenger
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Conversations
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.totalConversationCount}
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Stored messages
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.totalMessageCount}
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Webhook events
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.totalWebhookEventCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.latestReceivedAt
                ? `Latest message ${formatCrmDateTime(result.latestReceivedAt)}`
                : "No inbound messages received yet."}
            </p>
          </div>
        </div>

        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
          <Input
            defaultValue={result.filters.q}
            name="q"
            placeholder="Search sender ID, referral ref, or latest message"
          />
          <Select defaultValue={result.filters.status} name="status">
            {FACEBOOK_MESSENGER_CONVERSATION_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="outline">
            Apply
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/facebook/messenger">Reset</Link>
          </Button>
        </form>

        {result.conversations.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              No Messenger conversations yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Messenger webhook deliveries will appear here after the Page starts receiving inbound messages.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Conversation</TableHead>
                    <TableHead>Last message</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked inquiry</TableHead>
                    <TableHead>Last message time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.conversations.map((conversation) => (
                    <TableRow key={conversation.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {conversation.linkedCustomer?.full_name ?? conversation.sender_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conversation.sender_psid}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[320px] align-top">
                        <p className="line-clamp-2 text-sm text-foreground">
                          {conversation.last_message || conversation.last_message_preview || "No text content stored."}
                        </p>
                        {conversation.referral_ref ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Ref: {conversation.referral_ref}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {conversation.resolvedVehicle ? (
                          <Link
                            className="font-medium text-primary hover:underline"
                            href={`/admin/vehicles/${conversation.resolvedVehicle.id}`}
                          >
                            {conversation.resolvedVehicle.title}
                          </Link>
                        ) : (
                          "Not linked"
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <MessengerConversationStatusBadge status={conversation.status} />
                      </TableCell>
                      <TableCell className="align-top">
                        {conversation.linkedInquiry ? (
                          <div className="space-y-2">
                            <InquiryStatusBadge status={conversation.linkedInquiry.status} />
                            <div>
                              <Link
                                className="text-sm font-medium text-primary hover:underline"
                                href={`/admin/inquiries/${conversation.linkedInquiry.id}`}
                              >
                                Inquiry
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not converted
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {conversation.last_message_at
                          ? formatCrmDateTime(conversation.last_message_at)
                          : "No timestamp"}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/facebook/messenger/${conversation.id}`}>
                              View
                            </Link>
                          </Button>

                          {!conversation.inquiry_id ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/facebook/messenger/${conversation.id}#convert`}>
                                Convert
                              </Link>
                            </Button>
                          ) : null}

                          {conversation.status !== "reviewed" &&
                          conversation.status !== "converted" ? (
                            <form action={markMessengerConversationReviewed}>
                              <input
                                name="conversation_id"
                                type="hidden"
                                value={conversation.id}
                              />
                              <input
                                name="redirect_to"
                                type="hidden"
                                value="/admin/facebook/messenger"
                              />
                              <Button size="sm" type="submit" variant="outline">
                                Review
                              </Button>
                            </form>
                          ) : null}

                          {conversation.status !== "ignored" &&
                          conversation.status !== "converted" ? (
                            <form action={ignoreMessengerConversation}>
                              <input
                                name="conversation_id"
                                type="hidden"
                                value={conversation.id}
                              />
                              <input
                                name="redirect_to"
                                type="hidden"
                                value="/admin/facebook/messenger"
                              />
                              <ConfirmSubmitButton
                                confirmMessage="Ignore this Messenger conversation?"
                                pendingLabel="Ignoring..."
                                size="sm"
                                type="submit"
                                variant="outline"
                              >
                                Ignore
                              </ConfirmSubmitButton>
                            </form>
                          ) : null}

                          {conversation.linkedInquiry ? (
                            <Button asChild size="sm">
                              <Link href={`/admin/inquiries/${conversation.linkedInquiry.id}`}>
                                Open Inquiry
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
              Showing {result.conversations.length} of {result.totalConversationCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
