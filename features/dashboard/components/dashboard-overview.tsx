import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  MessageSquareMore,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DashboardColumnBarChart,
  DashboardDonutChart,
  DashboardMetricCard,
  DashboardPanel,
  DashboardPieChart,
  DashboardSalesTrendChart,
} from "@/features/dashboard/components/dashboard-charts";
import type { DashboardData } from "@/features/dashboard/types";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { getRoleLabel } from "@/lib/auth/permissions";
import type { AdminAccessContext } from "@/lib/auth/types";

type DashboardOverviewProps = {
  access: AdminAccessContext;
  data: DashboardData;
};

const quickActions = [
  {
    href: "/admin/vehicles/new",
    icon: CarFront,
    label: "Add Vehicle",
  },
  {
    href: "/admin/leads/new",
    icon: MessageSquareMore,
    label: "Add Lead",
  },
  {
    href: "/admin/sales/new",
    icon: TrendingUp,
    label: "Walk-in sale",
  },
  {
    href: "/admin/facebook",
    icon: Megaphone,
    label: "Facebook Sales Hub",
  },
];

export function DashboardOverview({
  access,
  data,
}: DashboardOverviewProps): ReactElement {
  const attentionCount =
    data.needsAttention.draftCount + data.needsAttention.missingPhotoCount;

  return (
    <PageContent
      title="Dashboard"
      description={access.dealership.name}
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/admin/pipeline">Pipeline</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/reports">Reports</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/vehicles/new">Add Vehicle</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            href="/admin/vehicles"
            label="Available inventory"
            sublabel={`${data.metrics.totalVehicles} total in inventory`}
            value={String(data.metrics.availableVehicles)}
          />
          <DashboardMetricCard
            href="/admin/pipeline"
            label="Active pipeline"
            sublabel={`${data.metrics.inquiriesThisMonth} new this month`}
            value={String(data.metrics.activePipeline)}
          />
          <DashboardMetricCard
            href="/admin/sales"
            label="Sales this month"
            sublabel={
              data.metrics.salesRevenueThisMonth !== null
                ? formatVehicleCurrency(data.metrics.salesRevenueThisMonth)
                : `${data.metrics.salesThisMonth} closed`
            }
            value={String(data.metrics.salesThisMonth)}
          />
          {data.metrics.openBalanceTotal !== null ? (
            <DashboardMetricCard
              href="/admin/sales"
              label="Open collections"
              sublabel={
                data.metrics.overduePlans && data.metrics.overduePlans > 0
                  ? `${data.metrics.overduePlans} overdue`
                  : "Financed balances"
              }
              tone={
                data.metrics.overduePlans && data.metrics.overduePlans > 0
                  ? "warning"
                  : "default"
              }
              value={formatVehicleCurrency(data.metrics.openBalanceTotal)}
            />
          ) : (
            <DashboardMetricCard
              href="/admin/pipeline?view=list"
              label="Total inquiries"
              sublabel="All lead sources"
              value={String(data.metrics.totalInquiries)}
            />
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <DashboardPanel
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/vehicles">Inventory</Link>
              </Button>
            }
            title="Inventory by make"
          >
            <DashboardPieChart
              emptyMessage="No vehicles yet. Add inventory to see the mix by make."
              segments={data.inventoryByMake}
            />
          </DashboardPanel>

          <DashboardPanel
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/pipeline">Open pipeline</Link>
              </Button>
            }
            title="Pipeline by stage"
          >
            <DashboardColumnBarChart
              emptyMessage="No inquiries yet. Leads will appear here once they come in."
              segments={data.pipelineByStage}
            />
          </DashboardPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <DashboardPanel
            action={
              data.metrics.salesRevenueThisMonth !== null ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/reports/sales">Sales report</Link>
                </Button>
              ) : undefined
            }
            title="Sales trend (last 6 months)"
          >
            <DashboardSalesTrendChart
              emptyMessage="No sales recorded yet."
              points={data.monthlySales}
              showRevenue={data.metrics.salesRevenueThisMonth !== null}
            />
          </DashboardPanel>

          <DashboardPanel
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/reports/lead-sources">Sources</Link>
              </Button>
            }
            title="Lead sources"
          >
            <DashboardDonutChart
              emptyMessage="Lead source mix appears once inquiries are captured."
              segments={data.leadSources}
            />
          </DashboardPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">
          <DashboardPanel
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/pipeline?view=list">View all</Link>
              </Button>
            }
            title="Recent inquiries"
          >
            {data.recentInquiries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No inquiries yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Website, Facebook, and manual leads will show up here.
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/admin/leads/new">Add Lead</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border rounded-2xl border border-border">
                {data.recentInquiries.map((inquiry) => (
                  <Link
                    key={inquiry.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[#fafaf9]"
                    href={`/admin/inquiries/${inquiry.id}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {inquiry.customerName}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {inquiry.vehicleTitle ?? "No vehicle linked"} · {inquiry.sourceLabel}
                      </p>
                    </div>
                    <InquiryStatusBadge status={inquiry.status} />
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>

          <div className="space-y-6">
            <section className="rounded-[20px] border border-border bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
                <Badge
                  className="rounded-full border-border bg-background text-[11px] font-semibold"
                  variant="outline"
                >
                  {getRoleLabel(access.membership.role)}
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    asChild
                    className="w-full justify-between"
                    variant="outline"
                  >
                    <Link href={action.href}>
                      <span className="flex items-center gap-2">
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </section>

            <section className="rounded-[20px] border border-border bg-white p-5">
              <h2 className="text-base font-semibold text-foreground">Needs attention</h2>
              {attentionCount === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Inventory looks healthy. Drafts and missing photos will surface here.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.needsAttention.draftCount > 0 ? (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm">
                      <span>Draft vehicles</span>
                      <span className="font-semibold text-foreground">
                        {data.needsAttention.draftCount}
                      </span>
                    </div>
                  ) : null}
                  {data.needsAttention.missingPhotoCount > 0 ? (
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm">
                      <span>Published without photo</span>
                      <span className="font-semibold text-foreground">
                        {data.needsAttention.missingPhotoCount}
                      </span>
                    </div>
                  ) : null}
                  <Button asChild className="w-full" size="sm" variant="outline">
                    <Link href="/admin/vehicles?status=draft">Review inventory</Link>
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </PageContent>
  );
}
