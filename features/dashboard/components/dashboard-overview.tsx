import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  FileText,
  MessageSquareMore,
  Megaphone,
} from "lucide-react";
import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalesCollectionsSummary } from "@/features/sales/types";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { getRoleLabel } from "@/lib/auth/permissions";
import type { AdminAccessContext } from "@/lib/auth/types";

type DashboardOverviewProps = {
  access: AdminAccessContext;
  collections: SalesCollectionsSummary | null;
};

const inventoryTabs = [
  "All",
  "Draft",
  "Published",
  "Reserved",
  "Sold",
  "Archived",
];

const quickActions = [
  {
    disabled: false,
    href: "/admin/vehicles/new",
    icon: CarFront,
    label: "Add Vehicle",
  },
  {
    disabled: false,
    href: "/admin/leads/new",
    icon: MessageSquareMore,
    label: "Add Lead",
  },
  {
    disabled: false,
    href: "/admin/facebook",
    icon: Megaphone,
    label: "Open Facebook Sales Hub",
  },
];

export function DashboardOverview({
  access,
  collections,
}: DashboardOverviewProps): ReactElement {
  return (
    <PageContent
      title="Dashboard"
      description={access.dealership.name}
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/admin/vehicles">View Vehicles</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/pipeline?view=list">View pipeline</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/settings">Open Settings</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/vehicles/new">Add Vehicle</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_340px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[20px] border border-border bg-white">
            <div className="space-y-4 border-b border-border px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Inventory overview
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Keep your public inventory current and ready to publish.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/admin/vehicles/new">Add Vehicle</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {inventoryTabs.map((tab) => (
                  <button
                    key={tab}
                    className={
                      tab === "All"
                        ? "rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                        : "rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground"
                    }
                    disabled={tab !== "All"}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Photo</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Inquiries</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={8} className="py-12">
                      <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CarFront className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            No vehicles yet.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Add your first vehicle to start building the public inventory.
                          </p>
                        </div>
                        <Button asChild size="sm">
                          <Link href="/admin/vehicles/new">Add Vehicle</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>Showing 0 of 0</p>
              <div className="flex items-center gap-2">
                <Button disabled size="sm" variant="outline">
                  Previous
                </Button>
                <Button disabled size="sm" variant="outline">
                  Next
                </Button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[20px] border border-border bg-white">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Recent inquiries
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manual leads added by the team will appear here, alongside connected channels later.
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/leads/new">Add Lead</Link>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MessageSquareMore className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            No inquiries yet.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            New leads will appear here once customers start contacting the dealership.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>Showing 0 of 0</p>
              <div className="flex items-center gap-2">
                <Button disabled size="sm" variant="outline">
                  Previous
                </Button>
                <Button disabled size="sm" variant="outline">
                  Next
                </Button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {collections && (collections.overdueCount > 0 || collections.openBalanceTotal > 0) ? (
            <section className="rounded-[20px] border border-border bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">Collections</h2>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/sales">Open sales</Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {collections.overdueCount > 0 ? (
                  <p className="font-medium text-amber-700">
                    {collections.overdueCount} overdue balance
                    {collections.overdueCount === 1 ? "" : "s"}
                  </p>
                ) : null}
                {collections.openBalanceTotal > 0 ? (
                  <p className="text-muted-foreground">
                    Open balance{" "}
                    <span className="font-semibold text-foreground">
                      {formatVehicleCurrency(collections.openBalanceTotal)}
                    </span>
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="rounded-[20px] border border-border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">
                Quick actions
              </h2>
              <Badge
                variant="outline"
                className="rounded-full border-border bg-background text-[11px] font-semibold"
              >
                {getRoleLabel(access.membership.role)}
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              {quickActions.map((action) => (
                action.disabled || !action.href ? (
                  <Button
                    key={action.label}
                    className="w-full justify-between"
                    disabled
                    variant="outline"
                  >
                    <span className="flex items-center gap-2">
                      <action.icon className="h-4 w-4" />
                      {action.label}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
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
                )
              ))}
              <Button asChild className="w-full justify-between">
                <Link href="/admin/settings">
                  Dealership Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="rounded-[20px] border border-border bg-white p-5">
            <h2 className="text-base font-semibold text-foreground">
              Vehicles needing attention
            </h2>
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-5">
              <p className="text-sm font-medium text-foreground">
                No vehicles need attention yet.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Drafts, low-photo listings, and sold units will surface here.
              </p>
            </div>
          </section>

          <section className="rounded-[20px] border border-border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">
                Facebook Sales Hub
              </h2>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                <p className="text-sm font-medium text-foreground">
                  Vehicle captions, Messenger links, and click tracking now live in the Facebook Sales Hub.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure the dealership page, generate content kits, and review Messenger CTA activity.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/facebook">Open Facebook Sales Hub</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </PageContent>
  );
}
