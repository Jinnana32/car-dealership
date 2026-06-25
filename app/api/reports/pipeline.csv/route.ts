import { NextResponse } from "next/server";

import { getPipelineReport } from "@/features/reports/queries";
import { buildCsvResponse, buildPipelineCsv } from "@/features/reports/utils";
import { canViewReports } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

export async function GET(request: Request): Promise<Response> {
  const access = await getAdminAccessContext();

  if (!access) {
    return NextResponse.redirect(new URL("/login?next=/admin/reports/pipeline", request.url));
  }

  if (!canViewReports(access.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const report = await getPipelineReport(access, Object.fromEntries(url.searchParams));

  return buildCsvResponse(
    "pipeline-report.csv",
    buildPipelineCsv(report.rows, report.followUps),
  );
}
