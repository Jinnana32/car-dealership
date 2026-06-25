import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { InquiryStatus } from "@/features/inquiries/types";
import { getInquiryStatusLabel } from "@/features/inquiries/utils";
import { cn } from "@/lib/utils";

const statusStyles: Record<InquiryStatus, string> = {
  contacted: "border-sky-200 bg-sky-50 text-sky-700",
  lost: "border-red-200 bg-red-50 text-red-700",
  negotiation: "border-amber-200 bg-amber-50 text-amber-700",
  new: "border-zinc-200 bg-zinc-100 text-zinc-700",
  reserved: "border-slate-200 bg-slate-100 text-slate-700",
  viewing_scheduled: "border-indigo-200 bg-indigo-50 text-indigo-700",
  won: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

type InquiryStatusBadgeProps = {
  status: InquiryStatus;
};

export function InquiryStatusBadge({
  status,
}: InquiryStatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", statusStyles[status])}
    >
      {getInquiryStatusLabel(status)}
    </Badge>
  );
}
