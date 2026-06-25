import Link from "next/link";
import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
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
import { INQUIRY_SOURCE_FILTER_OPTIONS, INQUIRY_STATUS_FILTER_OPTIONS } from "@/features/inquiries/constants";
import { getDealershipMemberOptions } from "@/features/inquiries/queries";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { formatCrmDate } from "@/features/inquiries/utils";
import { FollowUpBadge } from "@/features/pipeline/components/follow-up-badge";
import { ReportEmptyState } from "@/features/reports/components/report-empty-state";
import { ReportMetricCard } from "@/features/reports/components/report-metric-card";
import { getPipelineReport } from "@/features/reports/queries";
import { buildReportQueryString } from "@/features/reports/utils";
import { canViewReports } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type PipelineReportPageProps = {
  searchParams: Promise<{
    assignedToId?: string | string[];
    error?: string | string[];
    from?: string | string[];
    source?: string | string[];
    status?: string | string[];
    success?: string | string[];
    to?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PipelineReportPage({
  searchParams,
}: PipelineReportPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canViewReports(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Pipeline report access denied"
        description="Only owners and admins can view dealership reports."
      />
    );
  }

  const resolvedSearchParams = await searchParams;
  const [result, memberOptions] = await Promise.all([
    getPipelineReport(access, resolvedSearchParams),
    getDealershipMemberOptions(access),
  ]);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const exportHref = `/api/reports/pipeline.csv${buildReportQueryString({
    assignedToId: result.filters.assignedToId,
    from: result.filters.from,
    source: result.filters.source,
    status: result.filters.status,
    to: result.filters.to,
  })}`;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Pipeline Report"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/reports">Reports Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={exportHref}>Export CSV</Link>
            </Button>
          </>
        }
      >
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 2xl:grid-cols-[180px_180px_220px_220px_220px_auto]">
          <Input defaultValue={result.filters.from} name="from" type="date" />
          <Input defaultValue={result.filters.to} name="to" type="date" />
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
          <Select defaultValue={result.filters.assignedToId} name="assignedToId">
            <option value="">All assignees</option>
            {memberOptions.map((option) => (
              <option key={option.profileId} value={option.profileId}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/reports/pipeline">Reset</Link>
            </Button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ReportMetricCard label="Total inquiries" value={String(result.metrics.totalInquiries)} />
          <ReportMetricCard label="Overdue follow-ups" value={String(result.metrics.overdueCount)} />
          <ReportMetricCard label="Due today" value={String(result.metrics.dueTodayCount)} />
          <ReportMetricCard label="Average days in pipeline" value={`${result.metrics.averageDaysInPipeline.toFixed(1)} days`} />
          <ReportMetricCard label="Won / Lost" value={`${result.metrics.wonCount} / ${result.metrics.lostCount}`} />
        </div>

        {result.rows.every((row) => row.count === 0) ? (
          <ReportEmptyState
            actionHref="/admin/pipeline"
            actionLabel="Open Pipeline"
            description="Leads will appear here once the dealership starts receiving or adding inquiries."
            title="No pipeline activity yet"
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Oldest inquiry date</TableHead>
                    <TableHead>Newest inquiry date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row.status}>
                      <TableCell>
                        <InquiryStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.count}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCrmDate(row.oldestInquiryDate)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCrmDate(row.newestInquiryDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Assigned to</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.followUps.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.vehicleTitle ?? "Not linked"}</TableCell>
                      <TableCell>
                        <InquiryStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>
                        <InquirySourceBadge sourceType={row.sourceType} />
                      </TableCell>
                      <TableCell>
                        <FollowUpBadge bucket={row.bucket} value={row.followUpAt} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.assignedToName ?? "Unassigned"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/inquiries/${row.id}`}>Open inquiry</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
