import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { FacebookPublicationStatus } from "@/features/facebook/types";
import { getFacebookPublicationStatusLabel } from "@/features/facebook/utils";
import { cn } from "@/lib/utils";

const badgeStyles: Record<FacebookPublicationStatus, string> = {
  failed: "border-red-200 bg-red-50 text-red-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

type FacebookPublicationStatusBadgeProps = {
  status: FacebookPublicationStatus;
};

export function FacebookPublicationStatusBadge({
  status,
}: FacebookPublicationStatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
        badgeStyles[status],
      )}
    >
      {getFacebookPublicationStatusLabel(status)}
    </Badge>
  );
}
