import Link from "next/link";
import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusToast } from "@/components/ui/status-toast";
import { FacebookConnectionStatusBadge } from "@/features/facebook/components/facebook-connection-status-badge";
import { FACEBOOK_HUB_COMING_SOON_ITEMS } from "@/features/facebook/constants";
import {
  getFacebookContentPreview,
  getFacebookPublicationPreview,
  getFacebookPublicationUrl,
  getFacebookSalesHubData,
} from "@/features/facebook/queries";
import {
  getFacebookGeneratedContentLabel,
  getFacebookPublishTypeLabel,
} from "@/features/facebook/utils";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookHubPageProps = {
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

export default async function FacebookHubPage({
  searchParams,
}: FacebookHubPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const [error, success, data] = await Promise.all([
    Promise.resolve(getSearchParam(resolvedSearchParams.error)),
    Promise.resolve(getSearchParam(resolvedSearchParams.success)),
    getFacebookSalesHubData(access),
  ]);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Facebook Sales Hub"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/messenger">Messenger Inbox</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/leads">Imported Leads</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/comments">Post Comments</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/lead-forms">Lead Form Mappings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/content">Content History</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/published-posts">Published Posts</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/facebook/settings">Facebook Settings</Link>
            </Button>
          </>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Connection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <FacebookConnectionStatusBadge
                  status={data.connection?.status ?? "not_connected"}
                />
                {data.connection?.page_name ? (
                  <p className="text-sm font-medium text-foreground">
                    {data.connection.page_name}
                  </p>
                ) : null}
              </div>

              {data.connection ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Facebook page
                    </p>
                    {data.connection.facebook_page_url ? (
                      <a
                        className="text-sm font-medium text-primary hover:underline"
                        href={data.connection.facebook_page_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {data.connection.page_name || data.connection.facebook_page_url}
                      </a>
                    ) : (
                      <p className="text-sm text-foreground">
                        {data.connection.page_name || "Not set"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Messenger identifier
                    </p>
                    <p className="text-sm text-foreground">
                      {data.connection.messenger_page_identifier || "Not set"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Page ID
                    </p>
                    <p className="text-sm text-foreground">
                      {data.connection.page_id || "Not set"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Page username
                    </p>
                    <p className="text-sm text-foreground">
                      {data.connection.page_username || "Not set"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-6 text-sm text-muted-foreground">
                  No Facebook page settings have been configured yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Vehicle Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Published &amp; available
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.publishedAvailableVehiclesCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Missing price, photos, or description
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.vehiclesMissingReadinessCount}
                  </p>
                </div>
              </div>

              <Button asChild size="sm" variant="outline">
                <Link href="/admin/vehicles">Review Vehicles</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Page Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Published posts
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.publishedPostsCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Failed attempts
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.failedPublicationsCount}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {data.pagePublishingConfigured ? "Configured" : "Not configured"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.connection?.page_name ||
                      data.resolvedFacebookPageId ||
                      "No Page ID available yet."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Last successful post
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {data.lastSuccessfulPublication?.vehicle?.title || "No published posts yet"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.lastSuccessfulPublication?.published_at
                      ? formatCrmDateTime(data.lastSuccessfulPublication.published_at)
                      : "Publish a vehicle from its Facebook section to create the first post."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Last failed post
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {data.lastFailedPublication?.vehicle?.title || "No failed publish attempts"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.lastFailedPublication?.error_message ||
                      "Failed attempts will surface here with the latest error message."}
                  </p>
                </div>
              </div>

              <Button asChild size="sm" variant="outline">
                <Link href="/admin/facebook/published-posts">Open Publish History</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Lead Form Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Imported leads
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.totalFacebookLeadsCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Processed
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.processedLeadCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Failed
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {data.failedLeadCount}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Most recent lead
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {data.latestFacebookLead?.customer?.full_name ||
                    data.latestFacebookLead?.form_name ||
                    "No Facebook leads imported yet"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.latestFacebookLead
                    ? `${data.latestFacebookLead.form_name || data.latestFacebookLead.form_id || "Lead Form"} · ${formatCrmDateTime(
                        data.latestFacebookLead.received_at,
                      )}`
                    : "Leadgen submissions will appear here after the webhook receives a valid event."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/facebook/leads">Open Imported Leads</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/facebook/lead-forms">Manage Form Mappings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Generated Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentGeneratedContent.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-6 text-sm text-muted-foreground">
                  No generated captions or ad kits yet.
                </div>
              ) : (
                data.recentGeneratedContent.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {item.vehicle?.title ?? "Vehicle unavailable"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getFacebookGeneratedContentLabel(item.content_type)} ·{" "}
                          {formatCrmDateTime(item.created_at)}
                        </p>
                      </div>
                      {item.vehicle ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/vehicles/${item.vehicle.id}`}>View Vehicle</Link>
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm text-foreground">
                      {getFacebookContentPreview(item)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Recent Published Vehicle Posts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentPublishedPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-6 text-sm text-muted-foreground">
                  No Facebook Page posts published yet.
                </div>
              ) : (
                data.recentPublishedPosts.map((item) => {
                  const postUrl = getFacebookPublicationUrl(item);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {item.vehicle?.title ?? "Vehicle unavailable"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getFacebookPublishTypeLabel(item.publish_type)} ·{" "}
                            {item.published_at
                              ? formatCrmDateTime(item.published_at)
                              : formatCrmDateTime(item.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {item.vehicle ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/vehicles/${item.vehicle.id}`}>Vehicle</Link>
                            </Button>
                          ) : null}
                          {postUrl ? (
                            <Button asChild size="sm" variant="outline">
                              <a href={postUrl} rel="noreferrer" target="_blank">
                                Open Post
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-foreground">
                        {getFacebookPublicationPreview(item)}
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Recent Failed Publish Attempts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentFailedPublications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-6 text-sm text-muted-foreground">
                  No failed Facebook publish attempts.
                </div>
              ) : (
                data.recentFailedPublications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {item.vehicle?.title ?? "Vehicle unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getFacebookPublishTypeLabel(item.publish_type)} ·{" "}
                      {formatCrmDateTime(item.created_at)}
                    </p>
                    <p className="mt-3 text-sm text-red-700">
                      {item.error_message || "Publishing failed."}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Messenger Clicks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentMessengerClicks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-6 text-sm text-muted-foreground">
                  No Messenger CTA clicks tracked yet.
                </div>
              ) : (
                data.recentMessengerClicks.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {item.vehicle?.title ?? "Vehicle unavailable"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCrmDateTime(item.createdAt)}
                        </p>
                      </div>
                      {item.vehicle ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/vehicles/${item.vehicle.id}`}>View Vehicle</Link>
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item.sourceDetail || "Public vehicle detail page Messenger CTA"}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {FACEBOOK_HUB_COMING_SOON_ITEMS.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4 text-sm font-medium text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
