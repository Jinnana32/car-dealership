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
import { CopyToClipboardButton } from "@/features/facebook/components/copy-to-clipboard-button";
import { FACEBOOK_CONTENT_FILTER_OPTIONS } from "@/features/facebook/constants";
import {
  getFacebookContentHistory,
  getFacebookContentPreview,
} from "@/features/facebook/queries";
import { getFacebookGeneratedContentLabel } from "@/features/facebook/utils";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookContentPageProps = {
  searchParams: Promise<{
    contentType?: string | string[];
    error?: string | string[];
    success?: string | string[];
    vehicleId?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacebookContentPage({
  searchParams,
}: FacebookContentPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const result = await getFacebookContentHistory(access, resolvedSearchParams);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Facebook Content"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/facebook">Back to Hub</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/messenger">Messenger Inbox</Link>
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
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 lg:grid-cols-[240px_240px_auto]">
          <Select defaultValue={result.filters.vehicleId} name="vehicleId">
            <option value="">All vehicles</option>
            {result.vehicleOptions.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </option>
            ))}
          </Select>

          <Select defaultValue={result.filters.contentType} name="contentType">
            {FACEBOOK_CONTENT_FILTER_OPTIONS.map((option) => (
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
              <Link href="/admin/facebook/content">Reset</Link>
            </Button>
          </div>
        </form>

        {result.content.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              No generated Facebook content yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate captions and ad kits from any vehicle detail page.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.content.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">
                        {item.vehicle?.title ?? "Vehicle unavailable"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getFacebookGeneratedContentLabel(item.content_type)}
                      </TableCell>
                      <TableCell className="max-w-[440px]">
                        <p className="text-sm text-foreground">
                          {getFacebookContentPreview(item)}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.createdByName ?? "Team member"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCrmDateTime(item.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <CopyToClipboardButton
                            size="sm"
                            text={item.content}
                            variant="outline"
                          >
                            Copy
                          </CopyToClipboardButton>
                          {item.vehicle ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/vehicles/${item.vehicle.id}`}>Vehicle</Link>
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
              Showing {result.content.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
