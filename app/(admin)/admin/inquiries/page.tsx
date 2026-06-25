import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { buildPipelineHref } from "@/features/pipeline/utils";

type InquiriesPageProps = {
  searchParams: Promise<{
    assignedToId?: string | string[];
    followUp?: string | string[];
    search?: string | string[];
    source?: string | string[];
    status?: string | string[];
    vehicleId?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InquiriesPage({
  searchParams,
}: InquiriesPageProps): Promise<ReactElement | never> {
  const resolvedSearchParams = await searchParams;

  redirect(
    buildPipelineHref({
      assignedToId: getSearchParam(resolvedSearchParams.assignedToId) ?? "",
      followUp: getSearchParam(resolvedSearchParams.followUp) ?? "all",
      search: getSearchParam(resolvedSearchParams.search) ?? "",
      showClosed: true,
      source: getSearchParam(resolvedSearchParams.source) ?? "all",
      status: getSearchParam(resolvedSearchParams.status) ?? "all",
      vehicleId: getSearchParam(resolvedSearchParams.vehicleId) ?? "",
      view: "list",
    }),
  );
}
