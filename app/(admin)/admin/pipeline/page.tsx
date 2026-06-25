import Link from "next/link";
import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { StatusToast } from "@/components/ui/status-toast";
import { InquiryListTable } from "@/features/inquiries/components/inquiry-list-table";
import {
  getDealershipMemberOptions,
  getVehicleOptions,
} from "@/features/inquiries/queries";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import { PipelineEmptyState } from "@/features/pipeline/components/pipeline-empty-state";
import { PipelineFilters } from "@/features/pipeline/components/pipeline-filters";
import { PipelineInquiryPanelProvider } from "@/features/pipeline/components/pipeline-inquiry-panel-provider";
import { PipelineSummaryBar } from "@/features/pipeline/components/pipeline-summary-bar";
import { getPipelineData } from "@/features/pipeline/queries";
import { buildPipelineHref } from "@/features/pipeline/utils";
import { getAdminAccessContext } from "@/lib/auth/session";

type PipelinePageProps = {
  searchParams: Promise<{
    assignedToId?: string | string[];
    error?: string | string[];
    followUp?: string | string[];
    search?: string | string[];
    showClosed?: string | string[];
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
  const currentPath = buildPipelineHref({
    assignedToId: result.filters.assignedToId,
    followUp: result.filters.followUp,
    search: result.filters.search,
    showClosed: result.showClosed,
    source: result.filters.source,
    status: result.filters.status,
    vehicleId: result.filters.vehicleId,
    view: result.view,
  });
  const boardPath = buildPipelineHref({
    assignedToId: result.filters.assignedToId,
    followUp: result.filters.followUp,
    search: result.filters.search,
    showClosed: result.showClosed,
    source: result.filters.source,
    status: result.filters.status,
    vehicleId: result.filters.vehicleId,
    view: "board",
  });
  const listPath = buildPipelineHref({
    assignedToId: result.filters.assignedToId,
    followUp: result.filters.followUp,
    search: result.filters.search,
    showClosed: true,
    source: result.filters.source,
    status: result.filters.status,
    vehicleId: result.filters.vehicleId,
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
        <PipelineFilters
          assignedToId={result.filters.assignedToId}
          followUp={result.filters.followUp}
          memberOptions={memberOptions}
          search={result.filters.search}
          showClosed={result.showClosed}
          source={result.filters.source}
          status={result.filters.status}
          vehicleId={result.filters.vehicleId}
          vehicleOptions={vehicleOptions}
          view={result.view}
        />

        {result.inquiries.length > 0 ? (
          <PipelineSummaryBar
            showingCount={result.inquiries.length}
            summary={result.summary}
            totalCount={result.totalCount}
          />
        ) : null}

        {result.inquiries.length === 0 ? (
          <PipelineEmptyState />
        ) : result.view === "list" ? (
          <InquiryListTable inquiries={result.inquiries} />
        ) : (
          <PipelineInquiryPanelProvider redirectPath={currentPath}>
            <PipelineBoard
              columns={result.columns}
              currentProfileId={access.profile.id}
              memberOptions={memberOptions}
              redirectPath={currentPath}
              role={access.membership.role}
            />
          </PipelineInquiryPanelProvider>
        )}
      </PageContent>
    </>
  );
}
