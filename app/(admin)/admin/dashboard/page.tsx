import type { ReactElement } from "react";

import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getDashboardData } from "@/features/dashboard/queries";
import { getAdminAccessContext } from "@/lib/auth/session";

export default async function AdminDashboardPage(): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const data = await getDashboardData(access);

  return <DashboardOverview access={access} data={data} />;
}
