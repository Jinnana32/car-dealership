import type { Database } from "@/lib/supabase/database.types";

export type PipelineViewMode = "board" | "list";
export type InquiryFollowUpBucket = "overdue" | "today" | "future" | "none";
export type InquiryFollowUpFilter = "all" | InquiryFollowUpBucket;
export type PipelineStageKey =
  Database["public"]["Tables"]["inquiries"]["Row"]["status"];
export type LostReason =
  | "price_too_high"
  | "bought_elsewhere"
  | "not_responsive"
  | "financing_failed"
  | "vehicle_unavailable"
  | "other";

export type PipelineStageDefinition = {
  description: string | null;
  is_terminal: boolean;
  key: PipelineStageKey;
  label: string;
  sort_order: number;
};
