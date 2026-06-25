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
import {
  INQUIRY_SOURCE_FILTER_OPTIONS,
  INQUIRY_STATUS_FILTER_OPTIONS,
} from "@/features/inquiries/constants";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { getDealershipMemberOptions, getVehicleOptions } from "@/features/inquiries/queries";
import { formatCrmDateTime, getPaymentPreferenceLabel } from "@/features/inquiries/utils";
import { FollowUpBadge } from "@/features/pipeline/components/follow-up-badge";
import { getFollowUpBucket } from "@/features/pipeline/utils";
import { ReportEmptyState } from "@/features/reports/components/report-empty-state";
import { ReportMetricCard } from "@/features/reports/components/report-metric-card";
import { getInquiryReport } from "@/features/reports/queries";
import { buildReportQueryString } from "@/features/reports/utils";
import { canViewReports } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type InquiriesReportPageProps = {
  searchParams: Promise<{
    assignedToId?: string | string[];
    error?: string | string[];
    from?: string | string[];
    source?: string | string[];
    status?: string | string[];
    success?: string | string[];
    to?: string | string[];
    vehicleId?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InquiriesReportPage({
  searchParams,
}: InquiriesReportPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canViewReports(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Inquiry report access denied"
        description="Only owners and admins can view dealership reports."
      />
    );
  }

  const resolvedSearchParams = await searchParams;
  const [result, memberOptions, vehicleOptions] = await Promise.all([
    getInquiryReport(access, resolvedSearchParams),
    getDealershipMemberOptions(access),
    getVehicleOptions(access),
  ]);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const exportHref = `/api/reports/inquiries.csv${buildReportQueryString({
    assignedToId: result.filters.assignedToId,
    from: result.filters.from,
    source: result.filters.source,
    status: result.filters.status,
    to: result.filters.to,
    vehicleId: result.filters.vehicleId,
  })}`;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Inquiry Report"
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
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 2xl:grid-cols-[180px_180px_200px_200px_220px_220px_auto]">
          <Input defaultValue={result.filters.from} name="from" type="date" />
          <Input defaultValue={result.filters.to} name="to" type="date" />
          <Select defaultValue={result.filters.status} name="status">
            {INQUIRY_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.source} name="source">
            {INQUIRY_SOURCE_FILTER_OPTIONS.map((option) => (
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
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/reports/inquiries">Reset</Link>
            </Button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetricCard label="Total inquiries" value={String(result.metrics.totalInquiries)} />
          <ReportMetricCard label="New" value={String(result.metrics.new)} />
          <ReportMetricCard label="Contacted" value={String(result.metrics.contacted)} />
          <ReportMetricCard label="Viewing scheduled" value={String(result.metrics.viewingScheduled)} />
          <ReportMetricCard label="Negotiation" value={String(result.metrics.negotiation)} />
          <ReportMetricCard label="Reserved" value={String(result.metrics.reserved)} />
          <ReportMetricCard label="Won" value={String(result.metrics.won)} />
          <ReportMetricCard label="Lost" value={String(result.metrics.lost)} />
          <ReportMetricCard label="Conversion rate" value={`${result.metrics.conversionRate.toFixed(1)}%`} />
        </div>

        {result.rows.length === 0 ? (
          <ReportEmptyState
            actionHref="/admin/pipeline?view=list"
            actionLabel="Open pipeline"
            description="Adjust filters or create more leads to build the inquiry report."
            title="No inquiries match these filters"
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Created date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned to</TableHead>
                    <TableHead>Budget range</TableHead>
                    <TableHead>Payment preference</TableHead>
                    <TableHead>Next follow-up</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground">
                        {formatCrmDateTime(row.createdAt)}
                      </TableCell>
                      <TableCell>{row.customer?.full_name ?? "Not linked"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.vehicle?.title ?? "Not linked"}
                      </TableCell>
                      <TableCell>
                        <InquirySourceBadge sourceType={row.sourceType} />
                      </TableCell>
                      <TableCell>
                        <InquiryStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.assignedToName ?? "Unassigned"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.budgetRange ?? "Not set"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getPaymentPreferenceLabel(row.paymentPreference)}
                      </TableCell>
                      <TableCell>
                        <FollowUpBadge
                          bucket={getFollowUpBucket(row.followUpAt)}
                          value={row.followUpAt}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/inquiries/${row.id}`}>Inquiry</Link>
                          </Button>
                          {row.customer ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/customers/${row.customer.id}`}>Customer</Link>
                            </Button>
                          ) : null}
                          {row.vehicle ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/vehicles/${row.vehicle.id}`}>Vehicle</Link>
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
              Showing {result.rows.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
