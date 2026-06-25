import Link from "next/link";
import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/ui/status-toast";
import { InquiryListTable } from "@/features/inquiries/components/inquiry-list-table";
import {
  INQUIRY_SOURCE_FILTER_OPTIONS,
  INQUIRY_STATUS_FILTER_OPTIONS,
} from "@/features/inquiries/constants";
import {
  getDealershipMemberOptions,
  getVehicleOptions,
} from "@/features/inquiries/queries";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import { PipelineEmptyState } from "@/features/pipeline/components/pipeline-empty-state";
import { PIPELINE_FOLLOW_UP_FILTER_OPTIONS } from "@/features/pipeline/constants";
import { getPipelineData } from "@/features/pipeline/queries";
import { getAdminAccessContext } from "@/lib/auth/session";

type PipelinePageProps = {
  searchParams: Promise<{
    assignedToId?: string | string[];
    error?: string | string[];
    followUp?: string | string[];
    search?: string | string[];
    source?: string | string[];
    status?: string | string[];
    success?: string | string[];
    vehicleId?: string | string[];
    view?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildPipelinePath(input: {
  assignedToId?: string | string[];
  followUp?: string | string[];
  search?: string | string[];
  source?: string | string[];
  status?: string | string[];
  vehicleId?: string | string[];
  view?: string | string[];
}): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    const scalarValue = Array.isArray(value) ? value[0] : value;

    if (scalarValue) {
      searchParams.set(key, scalarValue);
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `/admin/pipeline?${queryString}` : "/admin/pipeline";
}

export default async function PipelinePage({
  searchParams,
}: PipelinePageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const [result, vehicleOptions, memberOptions] = await Promise.all([
    getPipelineData(access, resolvedSearchParams),
    getVehicleOptions(access),
    getDealershipMemberOptions(access),
  ]);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const currentPath = buildPipelinePath({
    assignedToId: resolvedSearchParams.assignedToId,
    followUp: resolvedSearchParams.followUp,
    search: resolvedSearchParams.search,
    source: resolvedSearchParams.source,
    status: resolvedSearchParams.status,
    vehicleId: resolvedSearchParams.vehicleId,
    view: resolvedSearchParams.view ?? result.view,
  });
  const boardPath = buildPipelinePath({
    assignedToId: resolvedSearchParams.assignedToId,
    followUp: resolvedSearchParams.followUp,
    search: resolvedSearchParams.search,
    source: resolvedSearchParams.source,
    status: resolvedSearchParams.status,
    vehicleId: resolvedSearchParams.vehicleId,
    view: "board",
  });
  const listPath = buildPipelinePath({
    assignedToId: resolvedSearchParams.assignedToId,
    followUp: resolvedSearchParams.followUp,
    search: resolvedSearchParams.search,
    source: resolvedSearchParams.source,
    status: resolvedSearchParams.status,
    vehicleId: resolvedSearchParams.vehicleId,
    view: "list",
  });

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Pipeline"
        actions={
          <Button asChild>
            <Link href="/admin/leads/new">Add Lead</Link>
          </Button>
        }
        tabs={
          <>
            <Button asChild size="sm" variant={result.view === "board" ? "default" : "outline"}>
              <Link href={boardPath}>Board View</Link>
            </Button>
            <Button asChild size="sm" variant={result.view === "list" ? "default" : "outline"}>
              <Link href={listPath}>List View</Link>
            </Button>
          </>
        }
      >
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 2xl:grid-cols-[minmax(0,1.3fr)_210px_190px_220px_220px_180px_auto]">
          <Input
            defaultValue={result.filters.search}
            name="search"
            placeholder="Search customer, vehicle, source detail, or message"
          />
          <Select defaultValue={result.filters.source} name="source">
            {INQUIRY_SOURCE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.status} name="status">
            {INQUIRY_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.vehicleId} name="vehicleId">
            <option value="">All vehicles</option>
            {vehicleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.assignedToId} name="assignedToId">
            <option value="">All assignees</option>
            {memberOptions.map((option) => (
              <option key={option.profileId} value={option.profileId}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.followUp} name="followUp">
            {PIPELINE_FOLLOW_UP_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <input name="view" type="hidden" value={result.view} />
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/admin/pipeline?view=${result.view}`}>Reset</Link>
            </Button>
          </div>
        </form>

        {result.inquiries.length === 0 ? (
          <PipelineEmptyState />
        ) : result.view === "list" ? (
          <>
            <InquiryListTable inquiries={result.inquiries} />
            <div className="px-1 text-sm text-muted-foreground">
              Showing {result.inquiries.length} of {result.totalCount}
            </div>
          </>
        ) : (
          <>
            <PipelineBoard
              columns={result.columns}
              currentProfileId={access.profile.id}
              memberOptions={memberOptions}
              redirectPath={currentPath}
              role={access.membership.role}
            />
            <div className="px-1 text-sm text-muted-foreground">
              Showing {result.inquiries.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
