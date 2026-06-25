import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type VehicleSpecItem = {
  content?: ReactNode;
  label: string;
  value?: string | null | undefined;
};

type VehicleSpecListProps = {
  compact?: boolean;
  items: VehicleSpecItem[];
  title?: string;
};

function isVisibleSpecValue(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length > 0 && normalized !== "not set";
}

function isVisibleSpecItem(item: VehicleSpecItem): boolean {
  if (item.content) {
    return true;
  }

  return isVisibleSpecValue(item.value);
}

export function VehicleSpecList({
  compact = false,
  items,
  title,
}: VehicleSpecListProps): ReactElement | null {
  const visibleItems = items.filter((item) => isVisibleSpecItem(item));

  if (visibleItems.length === 0) {
    return null;
  }

  const rowClassName = compact
    ? "grid gap-1 px-4 py-2.5 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center sm:gap-3"
    : "grid gap-1 px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4";

  return (
    <div className={cn("space-y-2", !compact && "space-y-3")}>
      {title ? (
        <p
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-xs uppercase tracking-[0.14em] text-muted-foreground" : "text-sm",
          )}
        >
          {title}
        </p>
      ) : null}
      <dl className="overflow-hidden rounded-2xl border border-border bg-white">
        {visibleItems.map((item, index) => (
          <div
            key={item.label}
            className={index === 0 ? rowClassName : cn(rowClassName, "border-t border-border")}
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </dt>
            <dd
              className={cn(
                "text-sm font-medium",
                item.value?.trim().toLowerCase() === "n/a"
                  ? "text-muted-foreground"
                  : "text-foreground",
              )}
            >
              {item.content ?? item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
