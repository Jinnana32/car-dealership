import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { formatCrmDate } from "@/features/inquiries/utils";
import type { InquiryFollowUpBucket } from "@/features/pipeline/types";
import { getFollowUpBucketLabel } from "@/features/pipeline/utils";
import { cn } from "@/lib/utils";

const followUpStyles: Record<InquiryFollowUpBucket, string> = {
  future: "border-sky-200 bg-sky-50 text-sky-700",
  none: "border-zinc-200 bg-zinc-100 text-zinc-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
  today: "border-amber-200 bg-amber-50 text-amber-700",
};

type FollowUpBadgeProps = {
  bucket: InquiryFollowUpBucket;
  value: string | null;
};

export function FollowUpBadge({
  bucket,
  value,
}: FollowUpBadgeProps): ReactElement {
  const label = getFollowUpBucketLabel(bucket);

  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", followUpStyles[bucket])}
    >
      {value ? `${label} · ${formatCrmDate(value)}` : label}
    </Badge>
  );
}
