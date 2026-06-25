import Link from "next/link";
import type { ReactElement } from "react";

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
import { FacebookPublicationStatusBadge } from "@/features/facebook/components/facebook-publication-status-badge";
import { FACEBOOK_PUBLICATION_STATUS_FILTER_OPTIONS } from "@/features/facebook/constants";
import {
  getFacebookPublicationHistory,
  getFacebookPublicationPreview,
  getFacebookPublicationUrl,
} from "@/features/facebook/queries";
import {
  getFacebookPublishTypeLabel,
} from "@/features/facebook/utils";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookPublishedPostsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    status?: string | string[];
    success?: string | string[];
    vehicleId?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacebookPublishedPostsPage({
  searchParams,
}: FacebookPublishedPostsPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const result = await getFacebookPublicationHistory(access, resolvedSearchParams);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Published Facebook Posts"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/facebook">Back to Hub</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/messenger">Messenger Inbox</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/content">Content History</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/facebook/settings">Facebook Settings</Link>
            </Button>
          </>
        }
      >
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 lg:grid-cols-[240px_240px_auto]">
          <Select defaultValue={result.filters.vehicleId} name="vehicleId">
            <option value="">All vehicles</option>
            {result.vehicleOptions.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </option>
            ))}
          </Select>

          <Select defaultValue={result.filters.status} name="status">
            {FACEBOOK_PUBLICATION_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/facebook/published-posts">Reset</Link>
            </Button>
          </div>
        </form>

        {result.publications.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              No Facebook Page publications yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish a vehicle from its Facebook section to start the post history.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Publish Type</TableHead>
                    <TableHead>Caption Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Facebook IDs</TableHead>
                    <TableHead>Published By</TableHead>
                    <TableHead>Published At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.publications.map((publication) => {
                    const postUrl = getFacebookPublicationUrl(publication);

                    return (
                      <TableRow key={publication.id}>
                        <TableCell className="font-medium text-foreground">
                          {publication.vehicle?.title ?? "Vehicle unavailable"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getFacebookPublishTypeLabel(publication.publish_type)}
                        </TableCell>
                        <TableCell className="max-w-[420px]">
                          <p className="text-sm text-foreground">
                            {getFacebookPublicationPreview(publication)}
                          </p>
                          {publication.error_message ? (
                            <p className="mt-2 text-xs text-red-700">
                              {publication.error_message}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <FacebookPublicationStatusBadge status={publication.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {publication.facebook_post_id ? (
                            <p>Post: {publication.facebook_post_id}</p>
                          ) : null}
                          {publication.facebook_photo_id ? (
                            <p>Photo: {publication.facebook_photo_id}</p>
                          ) : null}
                          {!publication.facebook_post_id && !publication.facebook_photo_id ? (
                            <p>Not available</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {publication.publishedByName ?? "Team member"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {publication.published_at
                            ? formatCrmDateTime(publication.published_at)
                            : "Not published"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {publication.vehicle ? (
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/admin/vehicles/${publication.vehicle.id}`}>
                                  Vehicle
                                </Link>
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="px-1 text-sm text-muted-foreground">
              Showing {result.publications.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
