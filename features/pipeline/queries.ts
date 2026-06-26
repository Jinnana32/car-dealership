import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessContext } from "@/lib/auth/types";
import { getInquiriesList } from "@/features/inquiries/queries";
import type { InquiryListItem, InquiryListResult, InquiryStatus } from "@/features/inquiries/types";
import { buildDefaultPipelineStages, buildPipelineSummary } from "@/features/pipeline/utils";
import type {
  PipelineStageDefinition,
  PipelineSummary,
  PipelineViewMode,
} from "@/features/pipeline/types";
import { pipelineViewSchema } from "@/features/pipeline/validators";

export type PipelineBoardColumn = {
  inquiries: InquiryListItem[];
  stage: PipelineStageDefinition;
};

export type PipelineDataResult = {
  columns: PipelineBoardColumn[];
  filters: InquiryListResult["filters"];
  inquiries: InquiryListItem[];
  showClosed: boolean;
  stages: PipelineStageDefinition[];
  summary: PipelineSummary;
  totalCount: number;
  view: PipelineViewMode;
};

type PipelineSearchParams = {
  assignedToId?: string | string[];
  followUp?: string | string[];
  search?: string | string[];
  showClosed?: string | string[];
  source?: string | string[];
  status?: string | string[];
  vehicleId?: string | string[];
  view?: string | string[];
};

function getScalarValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePipelineView(
  searchParams: PipelineSearchParams,
): PipelineViewMode {
  return pipelineViewSchema.parse(getScalarValue(searchParams.view));
}

export function parsePipelineShowClosed(
  searchParams: PipelineSearchParams,
  view: PipelineViewMode,
): boolean {
  if (view === "list") {
    return true;
  }

  const value = getScalarValue(searchParams.showClosed);

  return value === "true" || value === "1";
}

export async function getPipelineStages(
  access: AdminAccessContext,
): Promise<PipelineStageDefinition[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("key, label, description, sort_order, is_terminal")
    .eq("dealership_id", access.dealership.id)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return buildDefaultPipelineStages();
  }

  return data.map((stage) => ({
    description: stage.description,
    is_terminal: stage.is_terminal,
    key: stage.key as InquiryStatus,
    label: stage.label,
    sort_order: stage.sort_order,
  }));
}

export async function getPipelineData(
  access: AdminAccessContext,
  searchParams: PipelineSearchParams,
): Promise<PipelineDataResult> {
  const view = parsePipelineView(searchParams);
  const [showClosed, stages, inquiryList] = await Promise.all([
    Promise.resolve(parsePipelineShowClosed(searchParams, view)),
    getPipelineStages(access),
    getInquiriesList(access, searchParams),
  ]);

  const visibleStages = showClosed
    ? stages
    : stages.filter((stage) => !stage.is_terminal || stage.key === "won");

  const inquiriesByStatus = new Map<InquiryStatus, typeof inquiryList.inquiries>();

  for (const stage of stages) {
    inquiriesByStatus.set(stage.key, []);
  }

  for (const inquiry of inquiryList.inquiries) {
    const items = inquiriesByStatus.get(inquiry.status) ?? [];
    items.push(inquiry);
    inquiriesByStatus.set(inquiry.status, items);
  }

  return {
    columns: visibleStages.map((stage) => ({
      inquiries: inquiriesByStatus.get(stage.key) ?? [],
      stage,
    })),
    filters: inquiryList.filters,
    inquiries: inquiryList.inquiries,
    showClosed,
    stages,
    summary: buildPipelineSummary(inquiryList.inquiries),
    totalCount: inquiryList.totalCount,
    view,
  };
}
