import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import type { FacebookMessengerConversationStatus } from "@/features/facebook/types";
import { getFacebookMessengerConversationStatusLabel } from "@/features/facebook/utils";
import { cn } from "@/lib/utils";

const statusStyles: Record<FacebookMessengerConversationStatus, string> = {
  converted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ignored: "border-slate-200 bg-slate-100 text-slate-700",
  new: "border-amber-200 bg-amber-50 text-amber-700",
  reviewed: "border-blue-200 bg-blue-50 text-blue-700",
};

type MessengerConversationStatusBadgeProps = {
  status: FacebookMessengerConversationStatus;
};

export function MessengerConversationStatusBadge({
  status,
}: MessengerConversationStatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-1", statusStyles[status])}
    >
      {getFacebookMessengerConversationStatusLabel(status)}
    </Badge>
  );
}
