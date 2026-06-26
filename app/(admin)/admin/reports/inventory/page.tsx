import Link from "next/link";
import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/forms/currency-input";
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
import { ReportEmptyState } from "@/features/reports/components/report-empty-state";
import { ReportMetricCard } from "@/features/reports/components/report-metric-card";
import { getInventoryReport } from "@/features/reports/queries";
import { buildReportQueryString } from "@/features/reports/utils";
import { VehicleAvailabilityBadge } from "@/features/vehicles/components/vehicle-availability-badge";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import {
  VEHICLE_AVAILABILITY_FILTER_OPTIONS,
  VEHICLE_STATUS_FILTER_OPTIONS,
} from "@/features/vehicles/constants";
import {
  formatVehicleCurrency,
  formatVehicleDateTime,
  formatVehicleMileage,
} from "@/features/vehicles/utils";
import { canViewReports } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type InventoryReportPageProps = {
  searchParams: Promise<{
    availability?: string | string[];
    brand?: string | string[];
    error?: string | string[];
    maxPrice?: string | string[];
    minPrice?: string | string[];
    model?: string | string[];
    status?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InventoryReportPage({
  searchParams,
}: InventoryReportPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canViewReports(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Inventory report access denied"
        description="Only owners and admins can view dealership reports."
      />
    );
  }

  const resolvedSearchParams = await searchParams;
  const result = await getInventoryReport(access, resolvedSearchParams);
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const exportHref = `/api/reports/inventory.csv${buildReportQueryString({
    availability: result.filters.availability,
    brand: result.filters.brand,
    maxPrice: result.filters.maxPrice,
    minPrice: result.filters.minPrice,
    model: result.filters.model,
    status: result.filters.status,
  })}`;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Inventory Report"
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
        <form className="grid gap-3 rounded-[20px] border border-border bg-white p-4 2xl:grid-cols-[190px_190px_180px_180px_160px_160px_auto]">
          <Select defaultValue={result.filters.status} name="status">
            {VEHICLE_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select defaultValue={result.filters.availability} name="availability">
            {VEHICLE_AVAILABILITY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input defaultValue={result.filters.brand} name="brand" placeholder="Brand" />
          <Input defaultValue={result.filters.model} name="model" placeholder="Model" />
          <CurrencyInput defaultValue={result.filters.minPrice ?? ""} name="minPrice" placeholder="Min price" />
          <CurrencyInput defaultValue={result.filters.maxPrice ?? ""} name="maxPrice" placeholder="Max price" />
          <div className="flex gap-2">
            <Button type="submit" variant="outline">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/reports/inventory">Reset</Link>
            </Button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetricCard label="Total vehicles" value={String(result.metrics.totalVehicles)} />
          <ReportMetricCard label="Available vehicles" value={String(result.metrics.availableVehicles)} />
          <ReportMetricCard label="Draft vehicles" value={String(result.metrics.draftVehicles)} />
          <ReportMetricCard label="Reserved vehicles" value={String(result.metrics.reservedVehicles)} />
          <ReportMetricCard label="Sold vehicles" value={String(result.metrics.soldVehicles)} />
          <ReportMetricCard label="Archived vehicles" value={String(result.metrics.archivedVehicles)} />
          <ReportMetricCard label="Average price" value={formatVehicleCurrency(result.metrics.averagePrice)} />
          <ReportMetricCard label="Available listed value" value={formatVehicleCurrency(result.metrics.totalListedValue)} />
        </div>

        {result.rows.length === 0 ? (
          <ReportEmptyState
            actionHref="/admin/vehicles"
            actionLabel="Open Vehicles"
            description="Adjust filters or add more inventory to build the report."
            title="No inventory records match these filters"
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Inquiries</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-foreground">{row.title}</TableCell>
                      <TableCell className="text-muted-foreground">{row.brand}</TableCell>
                      <TableCell className="text-muted-foreground">{row.model}</TableCell>
                      <TableCell className="text-muted-foreground">{row.year ?? "Not set"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatVehicleCurrency(row.price)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatVehicleMileage(row.mileage)}</TableCell>
                      <TableCell><VehicleStatusBadge status={row.status} /></TableCell>
                      <TableCell><VehicleAvailabilityBadge availability={row.availability} /></TableCell>
                      <TableCell className="text-muted-foreground">{row.inquiriesCount}</TableCell>
                      <TableCell className="text-muted-foreground">{formatVehicleDateTime(row.created_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatVehicleDateTime(row.updated_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/vehicles/${row.id}`}>Open vehicle</Link>
                          </Button>
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
