import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { FACEBOOK_COMMENT_STATUS_LABELS } from "@/features/facebook/constants";
import type { FacebookCommentStatus } from "@/features/facebook/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<FacebookCommentStatus, string> = {
  duplicate: "border-zinc-200 bg-zinc-100 text-zinc-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  ignored: "border-zinc-200 bg-zinc-100 text-zinc-700",
  processed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  received: "border-sky-200 bg-sky-50 text-sky-700",
};

type FacebookCommentStatusBadgeProps = {
  className?: string;
  status: FacebookCommentStatus;
};

export function FacebookCommentStatusBadge({
  className,
  status,
}: FacebookCommentStatusBadgeProps): ReactElement {
  return (
    <Badge className={cn("font-medium", STATUS_STYLES[status], className)} variant="outline">
      {FACEBOOK_COMMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
