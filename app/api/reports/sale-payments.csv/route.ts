import { NextResponse } from "next/server";

import { getSalePaymentsReport } from "@/features/sales/queries";
import { buildSalePaymentsCsv } from "@/features/sales/utils";
import { buildCsvResponse } from "@/features/reports/utils";
import { canViewReports } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

export async function GET(request: Request): Promise<Response> {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.redirect(new URL("/login?next=/admin/sales", request.url));
  }

  if (!canViewReports(access.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const report = await getSalePaymentsReport(access, Object.fromEntries(url.searchParams));

  return buildCsvResponse("sale-payments.csv", buildSalePaymentsCsv(report.rows));
}
