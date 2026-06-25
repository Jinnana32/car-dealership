import type { ReactElement } from "react";

import { Badge } from "@/components/ui/badge";

type VehicleConditionBadgeProps = {
  conditionSummary: string | null;
};

export function VehicleConditionBadge({
  conditionSummary,
}: VehicleConditionBadgeProps): ReactElement | null {
  const label = conditionSummary?.trim();

  if (!label) {
    return null;
  }

  return (
    <Badge
      className="mt-1 max-w-[220px] truncate font-medium"
      title={label}
      variant="outline"
    >
      {label}
    </Badge>
  );
}
