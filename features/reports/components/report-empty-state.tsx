import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";

type ReportEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
};

export function ReportEmptyState({
  actionHref,
  actionLabel,
  description,
  title,
}: ReportEmptyStateProps): ReactElement {
  return (
    <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {actionHref && actionLabel ? (
        <Button asChild className="mt-4" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
