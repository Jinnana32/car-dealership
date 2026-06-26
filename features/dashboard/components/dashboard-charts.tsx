import type { ReactElement } from "react";

import type { DashboardChartSegment, DashboardMonthlySalesPoint } from "@/features/dashboard/types";
import { formatVehicleCurrency } from "@/features/vehicles/utils";

type DashboardMetricCardProps = {
  href?: string;
  label: string;
  sublabel?: string;
  tone?: "default" | "warning";
  value: string;
};

export function DashboardMetricCard({
  href,
  label,
  sublabel,
  tone = "default",
  value,
}: DashboardMetricCardProps): ReactElement {
  const content = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={
          tone === "warning"
            ? "mt-2 text-3xl font-semibold tracking-tight text-amber-700"
            : "mt-2 text-3xl font-semibold tracking-tight text-foreground"
        }
      >
        {value}
      </p>
      {sublabel ? <p className="mt-1 text-sm text-muted-foreground">{sublabel}</p> : null}
    </>
  );

  if (href) {
    return (
      <a
        className="block rounded-[20px] border border-border bg-white p-5 transition-colors hover:border-primary/30 hover:bg-[#fffafa]"
        href={href}
      >
        {content}
      </a>
    );
  }

  return <div className="rounded-[20px] border border-border bg-white p-5">{content}</div>;
}

type DashboardPanelProps = {
  action?: ReactElement;
  children: ReactElement;
  title: string;
};

export function DashboardPanel({
  action,
  children,
  title,
}: DashboardPanelProps): ReactElement {
  return (
    <section className="rounded-[20px] border border-border bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChartEmptyState({ message }: { message: string }): ReactElement {
  return (
    <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

type DashboardColumnBarChartProps = {
  emptyMessage: string;
  segments: DashboardChartSegment[];
};

export function DashboardColumnBarChart({
  emptyMessage,
  segments,
}: DashboardColumnBarChartProps): ReactElement {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  const maxValue = Math.max(...segments.map((segment) => segment.value), 1);

  return (
    <div className="space-y-3">
      <div className="relative flex h-52 items-end gap-1.5 border-b border-border px-1 pb-1 pt-6 sm:gap-2">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
            title={`${segment.label}: ${segment.value}`}
          >
            <span
              className={
                segment.value > 0
                  ? "text-xs font-semibold text-foreground"
                  : "text-xs text-transparent"
              }
            >
              {segment.value}
            </span>
            <div className="flex h-36 w-full items-end justify-center">
              <div
                className="w-full max-w-9 rounded-t-md transition-all"
                style={{
                  backgroundColor: segment.color,
                  height: `${(segment.value / maxValue) * 100}%`,
                  minHeight: segment.value > 0 ? "6px" : "2px",
                  opacity: segment.value > 0 ? 1 : 0.2,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        {segments.map((segment) => (
          <div key={segment.label} className="min-w-0 flex-1 text-center">
            <span className="block text-[10px] leading-tight text-muted-foreground sm:text-xs">
              {segment.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type DashboardPieChartProps = {
  emptyMessage: string;
  segments: DashboardChartSegment[];
};

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describePieSlice(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function DashboardPieChart({
  emptyMessage,
  segments,
}: DashboardPieChartProps): ReactElement {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  let cumulative = 0;
  const slices = segments.map((segment) => {
    const start = (cumulative / total) * 360;
    cumulative += segment.value;
    const end = (cumulative / total) * 360;

    return {
      ...segment,
      end,
      isFullCircle: segment.value === total,
      start,
    };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative h-44 w-44 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          {slices.map((slice) =>
            slice.isFullCircle ? (
              <circle key={slice.label} cx="60" cy="60" fill={slice.color} r="54" />
            ) : (
              <path
                key={slice.label}
                d={describePieSlice(60, 60, 54, slice.start, slice.end)}
                fill={slice.color}
              />
            ),
          )}
        </svg>
      </div>

      <div className="grid w-full gap-2 sm:flex-1">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-foreground">{segment.label}</span>
            </div>
            <span className="shrink-0 text-muted-foreground">
              {segment.value} ({Math.round((segment.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type DashboardSalesTrendChartProps = {
  emptyMessage: string;
  points: DashboardMonthlySalesPoint[];
  showRevenue: boolean;
};

export function DashboardSalesTrendChart({
  emptyMessage,
  points,
  showRevenue,
}: DashboardSalesTrendChartProps): ReactElement {
  const hasData = points.some((point) => point.soldCount > 0);

  if (!hasData) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  const maxCount = Math.max(...points.map((point) => point.soldCount), 1);
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-44 items-end gap-3">
        {points.map((point) => (
          <div key={point.monthKey} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <div
                className="w-full max-w-8 rounded-t-md bg-primary/80"
                style={{
                  height: `${(point.soldCount / maxCount) * 100}%`,
                  minHeight: point.soldCount > 0 ? "8px" : "0",
                }}
                title={`${point.soldCount} sale${point.soldCount === 1 ? "" : "s"}`}
              />
              {showRevenue ? (
                <div
                  className="w-full max-w-8 rounded-t-md bg-zinc-300"
                  style={{
                    height: `${(point.revenue / maxRevenue) * 100}%`,
                    minHeight: point.revenue > 0 ? "8px" : "0",
                  }}
                  title={formatVehicleCurrency(point.revenue)}
                />
              ) : null}
            </div>
            <span className="text-xs font-medium text-muted-foreground">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
          Units sold
        </span>
        {showRevenue ? (
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            Revenue
          </span>
        ) : null}
      </div>
    </div>
  );
}
