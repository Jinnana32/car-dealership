import type { ReactElement } from "react";

type ReportMetricCardProps = {
  label: string;
  value: string;
};

export function ReportMetricCard({
  label,
  value,
}: ReportMetricCardProps): ReactElement {
  return (
    <div className="rounded-[20px] border border-border bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
