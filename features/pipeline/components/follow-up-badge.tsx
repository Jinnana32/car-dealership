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
  compact?: boolean;
  value: string | null;
};

function getCompactFollowUpLabel(
  bucket: InquiryFollowUpBucket,
  value: string | null,
): string {
  const label = getFollowUpBucketLabel(bucket);

  if (!value) {
    return label;
  }

  if (bucket === "future") {
    return formatCrmDate(value);
  }

  return label;
}

export function FollowUpBadge({
  bucket,
  compact = false,
  value,
}: FollowUpBadgeProps): ReactElement {
  const label = compact ? getCompactFollowUpLabel(bucket, value) : getFollowUpBucketLabel(bucket);

  return (
    <Badge
      variant="outline"
      className={cn("max-w-full truncate border px-2 py-0.5 text-xs", followUpStyles[bucket])}
      title={value ? `${label} · ${formatCrmDate(value)}` : label}
    >
      {compact ? label : value ? `${label} · ${formatCrmDate(value)}` : label}
    </Badge>
  );
}
