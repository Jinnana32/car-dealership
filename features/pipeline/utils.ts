import {
  DEFAULT_PIPELINE_STAGES,
  LOST_REASON_LABELS,
  PIPELINE_STAGE_SEQUENCE,
} from "@/features/pipeline/constants";
import type { InquiryEvent, InquiryStatus } from "@/features/inquiries/types";
import type {
  InquiryFollowUpBucket,
  LostReason,
  PipelineStageDefinition,
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
