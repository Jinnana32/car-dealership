import Link from "next/link";
import type { ReactElement } from "react";

import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportMetricCard } from "@/features/reports/components/report-metric-card";
import { getReportsOverview } from "@/features/reports/queries";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { canViewReports } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

const reportLinks = [
  {
    description: "Closed deals, sold value, payment types, and sale history.",
    href: "/admin/reports/sales",
    title: "Sales Report",
  },
  {
    description: "Current stock mix, pricing, availability, and inquiry volume.",
    href: "/admin/reports/inventory",
    title: "Inventory Report",
  },
  {
    description: "Inquiry volume, stage distribution, and conversion tracking.",
    href: "/admin/reports/inquiries",
    title: "Inquiry Report",
  },
  {
    description: "Lead source performance across website, Facebook, and manual channels.",
    href: "/admin/reports/lead-sources",
    title: "Lead Source Report",
  },
  {
    description: "Status counts and follow-up pressure across the sales pipeline.",
    href: "/admin/reports/pipeline",
    title: "Pipeline Report",
  },
] as const;

export default async function ReportsOverviewPage(): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canViewReports(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Reports access denied"
        description="Only owners and admins can view dealership reports."
      />
    );
  }

  const overview = await getReportsOverview(access);

  return (
    <PageContent
      title="Reports"
      description="Real dealership performance based on inventory, inquiries, and recorded sales."
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/reports/sales">Open Sales Report</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportMetricCard label="Total vehicles" value={String(overview.totalVehicles)} />
        <ReportMetricCard label="Available vehicles" value={String(overview.availableVehicles)} />
        <ReportMetricCard label="Reserved vehicles" value={String(overview.reservedVehicles)} />
        <ReportMetricCard label="Sold vehicles" value={String(overview.soldVehicles)} />
        <ReportMetricCard label="Total inquiries" value={String(overview.totalInquiries)} />
        <ReportMetricCard label="Won inquiries" value={String(overview.wonInquiries)} />
        <ReportMetricCard label="Lost inquiries" value={String(overview.lostInquiries)} />
        <ReportMetricCard
          label="Total sales amount"
          value={formatVehicleCurrency(overview.totalSalesAmount)}
        />
        <ReportMetricCard
          label="Top lead source"
          value={overview.topLeadSource ?? "No inquiries yet"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {reportLinks.map((link) => (
          <Card key={link.href} className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">{link.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{link.description}</p>
              <Button asChild size="sm" variant="outline">
                <Link href={link.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContent>
  );
}
