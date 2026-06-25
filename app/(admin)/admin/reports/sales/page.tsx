import Link from "next/link";
import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
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
import { Input } from "@/components/ui/input";
import { getDealershipMemberOptions, getVehicleOptions } from "@/features/inquiries/queries";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { ReportEmptyState } from "@/features/reports/components/report-empty-state";
import { ReportMetricCard } from "@/features/reports/components/report-metric-card";
import { getSalesReport } from "@/features/reports/queries";
import { buildReportQueryString } from "@/features/reports/utils";
import { VEHICLE_SALE_PAYMENT_TYPE_FILTER_OPTIONS } from "@/features/sales/constants";
import { getVehicleSalePaymentTypeLabel } from "@/features/sales/utils";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { canViewReports } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type SalesReportPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    from?: string | string[];
    paymentType?: string | string[];
    soldById?: string | string[];
    success?: string | string[];
    to?: string | string[];
    vehicleId?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SalesReportPage({
  searchParams,
}: SalesReportPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canViewReports(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Sales report access denied"
        description="Only owners and admins can view dealership reports."
      />
    );
  }

  const resolvedSearchParams = await searchParams;
  const [result, vehicleOptions, memberOptions] = await Promise.all([
    getSalesReport(access, resolvedSearchParams),
    getVehicleOptions(access),
    getDealershipMemberOptions(access),
  ]);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const exportHref = `/api/reports/sales.csv${buildReportQueryString({
    from: result.filters.from,
    paymentType: result.filters.paymentType,
    soldById: result.filters.soldById,
    to: result.filters.to,
    vehicleId: result.filters.vehicleId,
  })}`;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Sales Report"
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
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 2xl:grid-cols-[180px_180px_240px_220px_220px_auto]">
          <Input defaultValue={result.filters.from} name="from" type="date" />
          <Input defaultValue={result.filters.to} name="to" type="date" />
          <Select defaultValue={result.filters.vehicleId} name="vehicleId">
            <option value="">All vehicles</option>
            {vehicleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.paymentType} name="paymentType">
            {VEHICLE_SALE_PAYMENT_TYPE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.soldById} name="soldById">
            <option value="">All sellers</option>
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
              <Link href="/admin/reports/sales">Reset</Link>
            </Button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ReportMetricCard
            label="Total sales amount"
            value={formatVehicleCurrency(result.metrics.totalSalesAmount)}
          />
          <ReportMetricCard
            label="Vehicles sold"
            value={String(result.metrics.soldCount)}
          />
          <ReportMetricCard
            label="Average sold price"
            value={formatVehicleCurrency(result.metrics.averageSoldPrice)}
          />
          <ReportMetricCard
            label="Highest sold price"
            value={formatVehicleCurrency(result.metrics.highestSoldPrice)}
          />
          <ReportMetricCard
            label="Lowest sold price"
            value={formatVehicleCurrency(result.metrics.lowestSoldPrice)}
          />
        </div>

        {result.rows.length === 0 ? (
          <ReportEmptyState
            actionHref="/admin/pipeline?view=list"
            actionLabel="Open pipeline"
            description="Record a won deal from an inquiry to start building the sales report."
            title="No sales recorded yet"
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Sold date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Inquiry source</TableHead>
                    <TableHead>Asking price</TableHead>
                    <TableHead>Sold price</TableHead>
                    <TableHead>Payment type</TableHead>
                    <TableHead>Sold by</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground">
                        {formatCrmDateTime(row.soldAt)}
                      </TableCell>
                      <TableCell>{row.vehicle?.title ?? "Not linked"}</TableCell>
                      <TableCell>{row.customer?.full_name ?? "Not linked"}</TableCell>
                      <TableCell>
                        {row.inquiry?.sourceType ? (
                          <InquirySourceBadge sourceType={row.inquiry.sourceType} />
                        ) : (
                          <span className="text-muted-foreground">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatVehicleCurrency(row.askingPrice)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatVehicleCurrency(row.soldPrice)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getVehicleSalePaymentTypeLabel(row.paymentType)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.createdByName ?? "Team member"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/sales/${row.id}`}>View sale</Link>
                          </Button>
                          {row.vehicle ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/vehicles/${row.vehicle.id}`}>Vehicle</Link>
                            </Button>
                          ) : null}
                          {row.customer ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/customers/${row.customer.id}`}>Customer</Link>
                            </Button>
                          ) : null}
                          {row.inquiry ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/inquiries/${row.inquiry.id}`}>Inquiry</Link>
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
