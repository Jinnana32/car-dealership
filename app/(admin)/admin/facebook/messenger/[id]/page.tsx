import Link from "next/link";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { PageContent } from "@/components/layout/page-content";
import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusToast } from "@/components/ui/status-toast";
import { MessengerConversionForm } from "@/features/facebook/components/messenger-conversion-form";
import { MessengerConversationStatusBadge } from "@/features/facebook/components/messenger-conversation-status-badge";
import {
  ignoreMessengerConversation,
  markMessengerConversationReviewed,
} from "@/features/facebook/messenger-actions";
import { getMessengerConversationDetail } from "@/features/facebook/messenger-queries";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import {
  getDealershipMemberOptions,
  getVehicleOptions,
} from "@/features/inquiries/queries";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { canCreateLeads } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookMessengerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacebookMessengerDetailPage({
  params,
  searchParams,
}: FacebookMessengerDetailPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const [result, memberOptions, vehicleOptions] = await Promise.all([
    getMessengerConversationDetail(access, id),
    getDealershipMemberOptions(access),
    getVehicleOptions(access),
  ]);
  const canConvert = canCreateLeads(access.membership.role);

  if (result.type === "forbidden") {
    return (
      <UnauthorizedState
        title="Messenger conversation access denied"
        description="This conversation belongs to a different dealership or is not available to the current account."
      />
    );
  }

  if (result.type === "not_found") {
    return (
      <PageContent
        title="Messenger Conversation"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/facebook/messenger">Back to Messenger</Link>
          </Button>
        }
      >
        <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            Conversation not found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The requested Messenger conversation is not available.
          </p>
        </div>
      </PageContent>
    );
  }

  const { conversation, messages } = result.record;
  const redirectPath = `/admin/facebook/messenger/${conversation.id}`;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title={conversation.linkedCustomer?.full_name ?? conversation.sender_id}
        actions={
          <>
            <MessengerConversationStatusBadge status={conversation.status} />
            <Button asChild variant="outline">
              <Link href="/admin/facebook/messenger">Back to Messenger</Link>
            </Button>
            {conversation.linkedInquiry ? (
              <Button asChild>
                <Link href={`/admin/inquiries/${conversation.linkedInquiry.id}`}>
                  Open Inquiry
                </Link>
              </Button>
            ) : null}
          </>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
          <div className="space-y-6">
            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Conversation details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Sender ID
                    </p>
                    <p className="mt-2 text-sm text-foreground">{conversation.sender_id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Page ID
                    </p>
                    <p className="mt-2 text-sm text-foreground">{conversation.page_id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Referral ref
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {conversation.referral_ref || "Not detected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Last message
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      {conversation.last_message_at
                        ? formatCrmDateTime(conversation.last_message_at)
                        : "No timestamp"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {conversation.resolvedVehicle ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/vehicles/${conversation.resolvedVehicle.id}`}>
                        {conversation.resolvedVehicle.title}
                      </Link>
                    </Button>
                  ) : (
                    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                      No vehicle detected
                    </span>
                  )}
                  {conversation.linkedCustomer ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/customers/${conversation.linkedCustomer.id}`}>
                        {conversation.linkedCustomer.full_name}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Message timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      No stored messages yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Messenger webhook deliveries will populate the message history here.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border bg-white px-2.5 py-1">
                          {message.direction === "inbound" ? "Inbound" : "Outbound"}
                        </span>
                        <span>{formatCrmDateTime(message.sent_at)}</span>
                        <span>Message ID: {message.facebook_message_id}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {message.message_text || "No text content stored for this message."}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Conversation actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversation.status !== "reviewed" &&
                conversation.status !== "converted" ? (
                  <form action={markMessengerConversationReviewed}>
                    <input name="conversation_id" type="hidden" value={conversation.id} />
                    <input name="redirect_to" type="hidden" value={redirectPath} />
                    <Button size="sm" type="submit" variant="outline">
                      Mark Reviewed
                    </Button>
                  </form>
                ) : null}

                {conversation.status !== "ignored" &&
                conversation.status !== "converted" ? (
                  <form action={ignoreMessengerConversation}>
                    <input name="conversation_id" type="hidden" value={conversation.id} />
                    <input name="redirect_to" type="hidden" value={redirectPath} />
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
                  <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">Linked inquiry</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <InquiryStatusBadge status={conversation.linkedInquiry.status} />
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/inquiries/${conversation.linkedInquiry.id}`}>
                          Open Linked Inquiry
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <MessengerConversionForm
              canConvert={canConvert}
              conversation={conversation}
              memberOptions={memberOptions}
              redirectPath={redirectPath}
              vehicleOptions={vehicleOptions}
            />
          </div>
        </div>
      </PageContent>
    </>
  );
}
