import { NextResponse } from "next/server";

import { BROCHURE_STORAGE_BUCKET } from "@/features/brochures/constants";
import { getBrochureExportForDownload } from "@/features/brochures/queries";
import { buildBrochureDownloadFileName } from "@/features/brochures/utils";
import { getAdminAccessContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DownloadBrochureRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: DownloadBrochureRouteProps,
): Promise<Response> {
  const access = await getAdminAccessContext();

  if (!access) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/admin/brochures");

    return NextResponse.redirect(loginUrl);
  }

  const { id } = await params;
  const brochure = await getBrochureExportForDownload(access, id);

  if (!brochure) {
    return NextResponse.json(
      {
        error: "Brochure export not found.",
      },
      {
        status: 404,
      },
    );
  }

  if (brochure.status !== "generated" || !brochure.storage_path) {
    return NextResponse.json(
      {
        error: "This brochure is not ready for download yet.",
      },
      {
        status: 409,
      },
    );
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase.storage
    .from(BROCHURE_STORAGE_BUCKET)
    .createSignedUrl(brochure.storage_path, 60, {
      download: buildBrochureDownloadFileName(brochure),
    });

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      {
        error: "Unable to create a brochure download link right now.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
