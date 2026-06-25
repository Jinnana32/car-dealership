import {
  DEFAULT_PIPELINE_STAGES,
  LOST_REASON_LABELS,
  PIPELINE_STAGE_COLORS,
  PIPELINE_STAGE_SEQUENCE,
} from "@/features/pipeline/constants";
import type { InquiryEvent, InquiryStatus } from "@/features/inquiries/types";
import type {
  InquiryFollowUpBucket,
  LostReason,
  PipelineColumnSummary,
  PipelineStageDefinition,
  PipelineStageKey,
  PipelineSummary,
  PipelineViewMode,
} from "@/features/pipeline/types";

export function buildDefaultPipelineStages(): PipelineStageDefinition[] {
  return DEFAULT_PIPELINE_STAGES.map((stage) => ({
    description: stage.description,
    is_terminal: stage.is_terminal,
    key: stage.key,
    label: stage.label,
    sort_order: stage.sort_order,
  }));
}

export function getFollowUpBucket(value: string | null): InquiryFollowUpBucket {
  if (!value) {
    return "none";
  }

  const followUpDate = new Date(value);

  if (Number.isNaN(followUpDate.getTime())) {
    return "none";
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  if (followUpDate < startOfToday) {
    return "overdue";
  }

  if (followUpDate < startOfTomorrow) {
    return "today";
  }

  return "future";
}

export function getFollowUpBucketLabel(bucket: InquiryFollowUpBucket): string {
  switch (bucket) {
    case "future":
      return "Future";
    case "none":
      return "No follow-up";
    case "overdue":
      return "Overdue";
    case "today":
      return "Due today";
    default:
      return "No follow-up";
  }
}

export function getLostReasonLabel(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  if (value in LOST_REASON_LABELS) {
    return LOST_REASON_LABELS[value as LostReason];
  }

  return value;
}

export function getInquiryEventLabel(
  eventType: InquiryEvent["event_type"],
): string {
  switch (eventType) {
    case "assigned":
      return "Assigned";
    case "created":
      return "Created";
    case "customer_updated":
      return "Customer Updated";
    case "follow_up_set":
      return "Follow-up Set";
    case "marked_lost":
      return "Marked Lost";
    case "marked_won":
      return "Marked Won";
    case "note_added":
      return "Note Added";
    case "status_changed":
      return "Stage Changed";
    case "vehicle_linked":
      return "Vehicle Linked";
    default:
      return "Activity";
  }
}

export function getNextPipelineStatus(status: InquiryStatus): InquiryStatus | null {
  if (status === "won" || status === "lost") {
    return null;
  }

  const index = PIPELINE_STAGE_SEQUENCE.indexOf(status);

  if (index === -1) {
    return null;
  }

  return PIPELINE_STAGE_SEQUENCE[index + 1] ?? null;
}

export function getPreviousPipelineStatus(
  status: InquiryStatus,
): InquiryStatus | null {
  if (status === "new" || status === "lost") {
    return null;
  }

  const index = PIPELINE_STAGE_SEQUENCE.indexOf(status);

  if (index <= 0) {
    return null;
  }

  return PIPELINE_STAGE_SEQUENCE[index - 1] ?? null;
}

export function truncatePipelineNote(
  value: string | null,
  maxLength = 120,
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function getPipelineStageColors(stageKey: PipelineStageKey) {
  return PIPELINE_STAGE_COLORS[stageKey];
}

function sumInquiryVehicleValue(
  inquiries: Array<{
    vehicle: { price: number | null } | null;
  }>,
): number {
  return inquiries.reduce((sum, inquiry) => {
    if (inquiry.vehicle?.price === null || inquiry.vehicle?.price === undefined) {
      return sum;
    }

    return sum + inquiry.vehicle.price;
  }, 0);
}

export function buildColumnSummary(
  inquiries: Array<{
    vehicle: { price: number | null } | null;
  }>,
): PipelineColumnSummary {
  return {
    count: inquiries.length,
    totalValue: sumInquiryVehicleValue(inquiries),
  };
}

export function buildPipelineSummary(
  inquiries: Array<{
    assigned_to: string | null;
    followUpBucket: InquiryFollowUpBucket;
    status: InquiryStatus;
    vehicle: { price: number | null } | null;
  }>,
): PipelineSummary {
  const activeInquiries = inquiries.filter(
    (inquiry) => inquiry.status !== "won" && inquiry.status !== "lost",
  );
  const wonInquiries = inquiries.filter((inquiry) => inquiry.status === "won");

  return {
    activeCount: activeInquiries.length,
    closedValue: sumInquiryVehicleValue(wonInquiries),
    overdueCount: inquiries.filter((inquiry) => inquiry.followUpBucket === "overdue")
      .length,
    pipeValue: sumInquiryVehicleValue(activeInquiries),
    unassignedCount: inquiries.filter((inquiry) => !inquiry.assigned_to).length,
  };
}

export type PipelineHrefFilters = {
  assignedToId?: string;
  followUp?: string;
  search?: string;
  showClosed?: boolean;
  source?: string;
  status?: string;
  vehicleId?: string;
  view?: PipelineViewMode;
};

export function buildPipelineHref(filters: PipelineHrefFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.search) {
    searchParams.set("search", filters.search);
  }

  if (filters.source && filters.source !== "all") {
    searchParams.set("source", filters.source);
  }

  if (filters.status && filters.status !== "all") {
    searchParams.set("status", filters.status);
  }

  if (filters.vehicleId) {
    searchParams.set("vehicleId", filters.vehicleId);
  }

  if (filters.assignedToId) {
    searchParams.set("assignedToId", filters.assignedToId);
  }

  if (filters.followUp && filters.followUp !== "all") {
    searchParams.set("followUp", filters.followUp);
  }

  if (filters.view) {
    searchParams.set("view", filters.view);
  }

  if (filters.showClosed) {
    searchParams.set("showClosed", "true");
  }

  const queryString = searchParams.toString();

  return queryString ? `/admin/pipeline?${queryString}` : "/admin/pipeline";
}

export function countActivePipelineFilters(input: {
  assignedToId: string;
  followUp: string;
  search: string;
  showClosed: boolean;
  source: string;
  status: string;
  vehicleId: string;
  view: PipelineViewMode;
}): number {
  let count = 0;

  if (input.search.trim()) {
    count += 1;
  }

  if (input.source !== "all") {
    count += 1;
  }

  if (input.view === "list" && input.status !== "all") {
    count += 1;
  }

  if (input.vehicleId) {
    count += 1;
  }

  if (input.assignedToId) {
    count += 1;
  }

  if (input.followUp !== "all") {
    count += 1;
  }

  if (input.view === "board" && input.showClosed) {
    count += 1;
  }

  return count;
}

export function getAssignedDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim();

  if (!trimmed) {
    return "Unassigned";
  }

  return trimmed.split(" ")[0] ?? trimmed;
}

export function getAssigneeInitials(name: string | null | undefined): string {
  const trimmed = name?.trim();

  if (!trimmed) {
    return "?";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
