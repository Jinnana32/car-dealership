import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { InquirySourceType } from "@/features/inquiries/types";
import { getInquirySourceLabel } from "@/features/inquiries/utils";
import { cn } from "@/lib/utils";

const sourceStyles: Record<InquirySourceType, string> = {
  facebook_comment: "border-zinc-200 bg-zinc-100 text-zinc-700",
  facebook_lead_form: "border-zinc-200 bg-zinc-100 text-zinc-700",
  facebook_messenger: "border-zinc-200 bg-zinc-100 text-zinc-700",
  manual_entry: "border-slate-200 bg-slate-100 text-slate-700",
  other: "border-zinc-200 bg-zinc-100 text-zinc-700",
  phone_call: "border-sky-200 bg-sky-50 text-sky-700",
  referral: "border-emerald-200 bg-emerald-50 text-emerald-700",
  viber: "border-violet-200 bg-violet-50 text-violet-700",
  walk_in: "border-amber-200 bg-amber-50 text-amber-700",
  website_inquiry_form: "border-zinc-200 bg-zinc-100 text-zinc-700",
  whatsapp: "border-green-200 bg-green-50 text-green-700",
};

type InquirySourceBadgeProps = {
  sourceType: InquirySourceType;
};

export function InquirySourceBadge({
  sourceType,
}: InquirySourceBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", sourceStyles[sourceType])}
    >
      {getInquirySourceLabel(sourceType)}
    </Badge>
  );
}
