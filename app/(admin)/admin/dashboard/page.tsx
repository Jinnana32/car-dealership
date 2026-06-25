import type { ReactElement } from "react";

import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getSalesCollectionsSummary } from "@/features/sales/queries";
import { canViewSales } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

export default async function AdminDashboardPage(): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const collections = canViewSales(access.membership.role)
    ? await getSalesCollectionsSummary(access)
    : null;

  return <DashboardOverview access={access} collections={collections} />;
}

