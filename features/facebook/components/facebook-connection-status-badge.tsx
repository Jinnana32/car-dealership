import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { FacebookConnectionStatus } from "@/features/facebook/types";
import { getFacebookConnectionStatusLabel } from "@/features/facebook/utils";
import { cn } from "@/lib/utils";

const badgeStyles: Record<FacebookConnectionStatus, string> = {
  configured: "border-amber-200 bg-amber-50 text-amber-700",
  connected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
  not_connected: "border-border bg-background text-muted-foreground",
};

type FacebookConnectionStatusBadgeProps = {
  status: FacebookConnectionStatus;
};

export function FacebookConnectionStatusBadge({
  status,
}: FacebookConnectionStatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
        badgeStyles[status],
      )}
    >
      {getFacebookConnectionStatusLabel(status)}
    </Badge>
  );
}
