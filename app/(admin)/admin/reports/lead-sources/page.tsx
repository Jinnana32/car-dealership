import Link from "next/link";
import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusToast } from "@/components/ui/status-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { ReportEmptyState } from "@/features/reports/components/report-empty-state";
import { ReportMetricCard } from "@/features/reports/components/report-metric-card";
import { getLeadSourceReport } from "@/features/reports/queries";
import { buildReportQueryString } from "@/features/reports/utils";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { canViewReports } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type LeadSourcesReportPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    from?: string | string[];
    success?: string | string[];
    to?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadSourcesReportPage({
  searchParams,
}: LeadSourcesReportPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canViewReports(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Lead source report access denied"
        description="Only owners and admins can view dealership reports."
      />
    );
  }

  const resolvedSearchParams = await searchParams;
  const result = await getLeadSourceReport(access, resolvedSearchParams);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const exportHref = `/api/reports/lead-sources.csv${buildReportQueryString({
    from: result.filters.from,
    to: result.filters.to,
  })}`;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Lead Source Report"
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
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 md:grid-cols-[180px_180px_auto]">
          <Input defaultValue={result.filters.from} name="from" type="date" />
          <Input defaultValue={result.filters.to} name="to" type="date" />
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/reports/lead-sources">Reset</Link>
            </Button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetricCard label="Processed leads" value={String(result.metrics.processedLeadCount)} />
          <ReportMetricCard label="Won leads" value={String(result.metrics.totalWonLeads)} />
          <ReportMetricCard label="Sales amount" value={formatVehicleCurrency(result.metrics.totalSalesAmount)} />
          <ReportMetricCard label="Top source" value={result.metrics.topSource ?? "No leads yet"} />
        </div>

        {result.rows.every((row) => row.totalInquiries === 0) ? (
          <ReportEmptyState
            actionHref="/admin/pipeline?view=list"
            actionLabel="Open pipeline"
            description="Lead source performance will appear after inquiries start flowing through the CRM."
            title="No lead source data yet"
          />
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Source</TableHead>
                  <TableHead>Total inquiries</TableHead>
                  <TableHead>Won</TableHead>
                  <TableHead>Lost</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Conversion rate</TableHead>
                  <TableHead>Sales amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row) => (
                  <TableRow key={row.sourceType}>
                    <TableCell>
                      <InquirySourceBadge sourceType={row.sourceType} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.totalInquiries}</TableCell>
                    <TableCell className="text-muted-foreground">{row.wonCount}</TableCell>
                    <TableCell className="text-muted-foreground">{row.lostCount}</TableCell>
                    <TableCell className="text-muted-foreground">{row.activeCount}</TableCell>
                    <TableCell className="text-muted-foreground">{row.conversionRate.toFixed(1)}%</TableCell>
                    <TableCell className="font-medium text-foreground">{formatVehicleCurrency(row.salesAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageContent>
    </>
  );
}
